import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmergencyStatus,
  Role,
  SOCKET_EVENTS,
  SOCKET_ROOMS,
} from '@medlink/shared';
import { AmbulanceDriverEntity } from '../database/entities/ambulance-driver.entity';
import { EmergencyRequestEntity } from '../database/entities/emergency-request.entity';

interface DriverLocationUpdate {
  lat: number;
  lng: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class MedlinkGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(AmbulanceDriverEntity)
    private readonly driverRepo: Repository<AmbulanceDriverEntity>,
    @InjectRepository(EmergencyRequestEntity)
    private readonly emergencyRepo: Repository<EmergencyRequestEntity>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      if (!payload.sub || !payload.role) {
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
      client.data.role = payload.role;

      client.join(SOCKET_ROOMS.PATIENT(payload.sub));
      if (payload.role === Role.HOSPITAL) client.join(SOCKET_ROOMS.HOSPITALS);
      if (payload.role === Role.DONOR) client.join(SOCKET_ROOMS.DONORS);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    client.rooms.forEach((room) => client.leave(room));
  }

  @SubscribeMessage(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE)
  async handleDriverLocation(
    @MessageBody() data: DriverLocationUpdate,
    @ConnectedSocket() client: Socket,
  ) {
    if (client.data.role !== Role.DRIVER) return;

    if (
      !Number.isFinite(data?.lat) ||
      !Number.isFinite(data?.lng) ||
      data.lat < -90 ||
      data.lat > 90 ||
      data.lng < -180 ||
      data.lng > 180
    ) {
      return;
    }

    const driver = await this.driverRepo.findOne({
      where: { userId: client.data.userId as string },
    });

    if (!driver) return;

    driver.latitude = data.lat;
    driver.longitude = data.lng;
    driver.lastLocationAt = new Date();
    await this.driverRepo.save(driver);

    const emergency = await this.emergencyRepo.findOne({
      where: {
        driverId: driver.id,
        status: EmergencyStatus.ACCEPTED,
      },
      order: { updatedAt: 'DESC' },
    });

    if (!emergency) return;

    client
      .to(SOCKET_ROOMS.PATIENT(emergency.patientId))
      .emit(SOCKET_EVENTS.DRIVER_LOCATION_BROADCAST, {
        lat: data.lat,
        lng: data.lng,
        driverId: driver.id,
        emergencyId: emergency.id,
        updatedAt: driver.lastLocationAt,
      });
  }

  emitNewEmergency(emergency: unknown) {
    this.server.to(SOCKET_ROOMS.HOSPITALS).emit(SOCKET_EVENTS.EMERGENCY_NEW, emergency);
  }

  emitEmergencyUpdated(patientId: string, emergency: unknown) {
    this.server.to(SOCKET_ROOMS.PATIENT(patientId)).emit(SOCKET_EVENTS.EMERGENCY_UPDATED, emergency);
  }

  emitNewBloodRequest(request: unknown) {
    this.server.to(SOCKET_ROOMS.DONORS).emit(SOCKET_EVENTS.BLOOD_NEW_REQUEST, request);
  }

  emitBloodRequestFulfilled(patientId: string, request: unknown) {
    this.server.to(SOCKET_ROOMS.PATIENT(patientId)).emit(SOCKET_EVENTS.BLOOD_REQUEST_FULFILLED, request);
  }

  emitHospitalResourceUpdate(update: unknown) {
    this.server.emit(SOCKET_EVENTS.HOSPITAL_RESOURCE_UPDATE, update);
  }

  emitNotification(userId: string, notification: unknown) {
    this.server.to(SOCKET_ROOMS.PATIENT(userId)).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
  }
}

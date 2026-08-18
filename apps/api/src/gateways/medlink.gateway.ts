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
import { UserEntity } from '../database/entities/user.entity';

interface DriverLocationUpdate {
  lat: number;
  lng: number;
}

interface AuthenticatedSocketData {
  userId: string;
  role: Role;
}

function isValidRole(value: unknown): value is Role {
  return Object.values(Role).includes(value as Role);
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
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
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

      if (!payload.sub || !isValidRole(payload.role)) {
        client.disconnect();
        return;
      }

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive || user.role !== payload.role) {
        client.disconnect();
        return;
      }

      const data: AuthenticatedSocketData = {
        userId: user.id,
        role: user.role,
      };
      client.data = data;

      if (user.role === Role.PATIENT) client.join(SOCKET_ROOMS.PATIENT(user.id));
      if (user.role === Role.HOSPITAL) client.join(SOCKET_ROOMS.HOSPITALS);
      if (user.role === Role.DONOR) client.join(SOCKET_ROOMS.DONORS);
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
        updatedAt: driver.lastLocationAt,
      });
  }

  emitNewEmergency(emergency: unknown) {
    const value = emergency as Partial<EmergencyRequestEntity>;
    this.server.to(SOCKET_ROOMS.HOSPITALS).emit(SOCKET_EVENTS.EMERGENCY_NEW, {
      id: value.id,
      type: value.type,
      status: value.status,
      patientLat: value.patientLat,
      patientLng: value.patientLng,
      hospitalId: value.hospitalId,
      driverId: value.driverId,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    });
  }

  emitEmergencyUpdated(patientId: string, emergency: unknown) {
    const value = emergency as Partial<EmergencyRequestEntity>;
    this.server.to(SOCKET_ROOMS.PATIENT(patientId)).emit(SOCKET_EVENTS.EMERGENCY_UPDATED, {
      id: value.id,
      type: value.type,
      status: value.status,
      patientLat: value.patientLat,
      patientLng: value.patientLng,
      hospitalId: value.hospitalId,
      driverId: value.driverId,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      resolvedAt: value.resolvedAt,
    });
  }

  emitNewBloodRequest(request: unknown) {
    const value = request as Record<string, unknown>;
    this.server.to(SOCKET_ROOMS.DONORS).emit(SOCKET_EVENTS.BLOOD_NEW_REQUEST, {
      id: value.id,
      bloodGroup: value.bloodGroup,
      units: value.units,
      hospitalId: value.hospitalId,
      status: value.status,
      createdAt: value.createdAt,
    });
  }

  emitBloodRequestFulfilled(patientId: string, request: unknown) {
    const value = request as Record<string, unknown>;
    this.server.to(SOCKET_ROOMS.PATIENT(patientId)).emit(SOCKET_EVENTS.BLOOD_REQUEST_FULFILLED, {
      id: value.id,
      status: value.status,
      fulfilledAt: value.fulfilledAt,
    });
  }

  emitHospitalResourceUpdate(update: unknown) {
    const value = update as Record<string, unknown>;
    this.server.emit(SOCKET_EVENTS.HOSPITAL_RESOURCE_UPDATE, {
      hospitalId: value.hospitalId,
      resourceType: value.resourceType,
      available: value.available,
      updatedAt: value.updatedAt,
    });
  }

  emitNotification(userId: string, notification: unknown) {
    const value = notification as Record<string, unknown>;
    this.server.to(SOCKET_ROOMS.PATIENT(userId)).emit(SOCKET_EVENTS.NOTIFICATION_NEW, {
      id: value.id,
      type: value.type,
      title: value.title,
      message: value.message,
      createdAt: value.createdAt,
    });
  }
}

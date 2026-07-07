import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SOCKET_EVENTS, SOCKET_ROOMS, Role } from '@medlink/shared';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/' })
export class MedlinkGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token, { secret: this.config.get<string>('JWT_SECRET') });
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
  handleDriverLocation(@MessageBody() data: { lat: number; lng: number }, @ConnectedSocket() client: Socket) {
    const driverId = client.data.userId as string;
    client.to(SOCKET_ROOMS.PATIENT(driverId)).emit(SOCKET_EVENTS.DRIVER_LOCATION_BROADCAST, { lat: data.lat, lng: data.lng, driverId });
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

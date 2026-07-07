import { EmergencyStatus, EmergencyType } from '../enums/status.enum';
export interface IEmergencyRequest {
    id: string;
    patientId: string;
    hospitalId?: string;
    driverId?: string;
    type: EmergencyType;
    status: EmergencyStatus;
    patientLat: number;
    patientLng: number;
    description?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

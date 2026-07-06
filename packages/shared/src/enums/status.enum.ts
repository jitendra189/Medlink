export enum EmergencyStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  RESOLVED = 'resolved',
}

export enum EmergencyType {
  ICU = 'icu',
  AMBULANCE = 'ambulance',
  GENERAL = 'general',
}

export enum BloodRequestStatus {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

export enum BloodRequestUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  CRITICAL = 'critical',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum BookingType {
  DOCTOR = 'doctor',
  ICU = 'icu',
}

export enum NotificationType {
  EMERGENCY = 'emergency',
  BLOOD = 'blood',
  BOOKING = 'booking',
  SYSTEM = 'system',
}

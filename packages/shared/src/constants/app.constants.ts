export const APP_NAME = 'MedLink';
export const API_PREFIX = 'api/v1';
export const DEFAULT_SEARCH_RADIUS_KM = 25;
export const MAX_SEARCH_RADIUS_KM = 100;
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const BCRYPT_SALT_ROUNDS = 12;
export const THROTTLE_TTL_SECONDS = 60;
export const THROTTLE_LIMIT = 100;
export const AUTH_THROTTLE_LIMIT = 10;

export const SOCKET_EVENTS = {
  EMERGENCY_NEW: 'emergency:new',
  EMERGENCY_UPDATED: 'emergency:updated',
  EMERGENCY_DRIVER_DISPATCHED: 'emergency:driver_dispatched',
  BLOOD_NEW_REQUEST: 'blood:new_request',
  BLOOD_REQUEST_FULFILLED: 'blood:request_fulfilled',
  DRIVER_LOCATION_UPDATE: 'driver:location_update',
  DRIVER_LOCATION_BROADCAST: 'driver:location_broadcast',
  HOSPITAL_RESOURCE_UPDATE: 'hospital:resource_update',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export const SOCKET_ROOMS = {
  HOSPITALS: 'hospitals',
  DONORS: 'donors',
  PATIENT: (id: string) => `patient:${id}`,
  HOSPITAL: (id: string) => `hospital:${id}`,
  DRIVER: (id: string) => `driver:${id}`,
} as const;

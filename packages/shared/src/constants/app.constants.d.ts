export declare const APP_NAME = "MedLink";
export declare const API_PREFIX = "api/v1";
export declare const DEFAULT_SEARCH_RADIUS_KM = 25;
export declare const MAX_SEARCH_RADIUS_KM = 100;
export declare const ACCESS_TOKEN_EXPIRY = "15m";
export declare const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export declare const BCRYPT_SALT_ROUNDS = 12;
export declare const THROTTLE_TTL_SECONDS = 60;
export declare const THROTTLE_LIMIT = 100;
export declare const AUTH_THROTTLE_LIMIT = 10;
export declare const SOCKET_EVENTS: {
    readonly EMERGENCY_NEW: "emergency:new";
    readonly EMERGENCY_UPDATED: "emergency:updated";
    readonly EMERGENCY_DRIVER_DISPATCHED: "emergency:driver_dispatched";
    readonly BLOOD_NEW_REQUEST: "blood:new_request";
    readonly BLOOD_REQUEST_FULFILLED: "blood:request_fulfilled";
    readonly DRIVER_LOCATION_UPDATE: "driver:location_update";
    readonly DRIVER_LOCATION_BROADCAST: "driver:location_broadcast";
    readonly HOSPITAL_RESOURCE_UPDATE: "hospital:resource_update";
    readonly NOTIFICATION_NEW: "notification:new";
};
export declare const SOCKET_ROOMS: {
    readonly HOSPITALS: "hospitals";
    readonly DONORS: "donors";
    readonly PATIENT: (id: string) => string;
    readonly HOSPITAL: (id: string) => string;
    readonly DRIVER: (id: string) => string;
};

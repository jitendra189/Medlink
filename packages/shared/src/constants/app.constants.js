"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_ROOMS = exports.SOCKET_EVENTS = exports.AUTH_THROTTLE_LIMIT = exports.THROTTLE_LIMIT = exports.THROTTLE_TTL_SECONDS = exports.BCRYPT_SALT_ROUNDS = exports.REFRESH_TOKEN_EXPIRY_DAYS = exports.ACCESS_TOKEN_EXPIRY = exports.MAX_SEARCH_RADIUS_KM = exports.DEFAULT_SEARCH_RADIUS_KM = exports.API_PREFIX = exports.APP_NAME = void 0;
exports.APP_NAME = 'MedLink';
exports.API_PREFIX = 'api/v1';
exports.DEFAULT_SEARCH_RADIUS_KM = 25;
exports.MAX_SEARCH_RADIUS_KM = 100;
exports.ACCESS_TOKEN_EXPIRY = '15m';
exports.REFRESH_TOKEN_EXPIRY_DAYS = 7;
exports.BCRYPT_SALT_ROUNDS = 12;
exports.THROTTLE_TTL_SECONDS = 60;
exports.THROTTLE_LIMIT = 100;
exports.AUTH_THROTTLE_LIMIT = 10;
exports.SOCKET_EVENTS = {
    EMERGENCY_NEW: 'emergency:new',
    EMERGENCY_UPDATED: 'emergency:updated',
    EMERGENCY_DRIVER_DISPATCHED: 'emergency:driver_dispatched',
    BLOOD_NEW_REQUEST: 'blood:new_request',
    BLOOD_REQUEST_FULFILLED: 'blood:request_fulfilled',
    DRIVER_LOCATION_UPDATE: 'driver:location_update',
    DRIVER_LOCATION_BROADCAST: 'driver:location_broadcast',
    HOSPITAL_RESOURCE_UPDATE: 'hospital:resource_update',
    NOTIFICATION_NEW: 'notification:new',
};
exports.SOCKET_ROOMS = {
    HOSPITALS: 'hospitals',
    DONORS: 'donors',
    PATIENT: (id) => `patient:${id}`,
    HOSPITAL: (id) => `hospital:${id}`,
    DRIVER: (id) => `driver:${id}`,
};
//# sourceMappingURL=app.constants.js.map
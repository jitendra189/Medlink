"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.BookingType = exports.BookingStatus = exports.BloodRequestUrgency = exports.BloodRequestStatus = exports.EmergencyType = exports.EmergencyStatus = void 0;
var EmergencyStatus;
(function (EmergencyStatus) {
    EmergencyStatus["PENDING"] = "pending";
    EmergencyStatus["ACCEPTED"] = "accepted";
    EmergencyStatus["REJECTED"] = "rejected";
    EmergencyStatus["CANCELLED"] = "cancelled";
    EmergencyStatus["RESOLVED"] = "resolved";
})(EmergencyStatus || (exports.EmergencyStatus = EmergencyStatus = {}));
var EmergencyType;
(function (EmergencyType) {
    EmergencyType["ICU"] = "icu";
    EmergencyType["AMBULANCE"] = "ambulance";
    EmergencyType["GENERAL"] = "general";
})(EmergencyType || (exports.EmergencyType = EmergencyType = {}));
var BloodRequestStatus;
(function (BloodRequestStatus) {
    BloodRequestStatus["PENDING"] = "pending";
    BloodRequestStatus["FULFILLED"] = "fulfilled";
    BloodRequestStatus["CANCELLED"] = "cancelled";
})(BloodRequestStatus || (exports.BloodRequestStatus = BloodRequestStatus = {}));
var BloodRequestUrgency;
(function (BloodRequestUrgency) {
    BloodRequestUrgency["LOW"] = "low";
    BloodRequestUrgency["MEDIUM"] = "medium";
    BloodRequestUrgency["CRITICAL"] = "critical";
})(BloodRequestUrgency || (exports.BloodRequestUrgency = BloodRequestUrgency = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["COMPLETED"] = "completed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var BookingType;
(function (BookingType) {
    BookingType["DOCTOR"] = "doctor";
    BookingType["ICU"] = "icu";
})(BookingType || (exports.BookingType = BookingType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["EMERGENCY"] = "emergency";
    NotificationType["BLOOD"] = "blood";
    NotificationType["BOOKING"] = "booking";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=status.enum.js.map
export declare enum EmergencyStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    CANCELLED = "cancelled",
    RESOLVED = "resolved"
}
export declare enum EmergencyType {
    ICU = "icu",
    AMBULANCE = "ambulance",
    GENERAL = "general"
}
export declare enum BloodRequestStatus {
    PENDING = "pending",
    FULFILLED = "fulfilled",
    CANCELLED = "cancelled"
}
export declare enum BloodRequestUrgency {
    LOW = "low",
    MEDIUM = "medium",
    CRITICAL = "critical"
}
export declare enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CANCELLED = "cancelled",
    COMPLETED = "completed"
}
export declare enum BookingType {
    DOCTOR = "doctor",
    ICU = "icu"
}
export declare enum NotificationType {
    EMERGENCY = "emergency",
    BLOOD = "blood",
    BOOKING = "booking",
    SYSTEM = "system"
}

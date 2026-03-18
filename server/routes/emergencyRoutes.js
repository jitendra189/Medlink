const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const emergencyController = require("../controllers/emergencyController");

/* =========================
   CREATE EMERGENCY REQUEST (PATIENT)
========================= */

router.post(
"/request",
authMiddleware,
roleMiddleware("patient"),
emergencyController.createEmergency
);

/* =========================
   GET ALL EMERGENCIES (HOSPITAL)
========================= */

router.get(
"/requests",
authMiddleware,
roleMiddleware("hospital"),
emergencyController.getEmergencies
);

/* =========================
   ACCEPT EMERGENCY
========================= */

router.put(
"/accept/:id",
authMiddleware,
roleMiddleware("hospital"),
emergencyController.acceptEmergency
);

/* =========================
   REJECT EMERGENCY
========================= */

router.put(
"/reject/:id",
authMiddleware,
roleMiddleware("hospital"),
emergencyController.rejectEmergency
);

/* =========================
   GET MY EMERGENCIES (PATIENT)
========================= */

router.get(
"/my",
authMiddleware,
roleMiddleware("patient"),
emergencyController.getMyEmergencies
);

/* =========================
   CANCEL REQUEST (PATIENT)
========================= */

router.put(
"/cancel/:id",
authMiddleware,
roleMiddleware("patient"),
emergencyController.cancelEmergency
);

module.exports = router;
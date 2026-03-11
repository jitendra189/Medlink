const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const emergencyController = require("../controllers/emergencyController");

router.post(
"/request",
authMiddleware,
roleMiddleware("patient"),
emergencyController.createEmergency
);

router.get(
"/requests",
authMiddleware,
roleMiddleware("hospital"),
emergencyController.getEmergencies
);

router.put(
"/accept/:id",
authMiddleware,
roleMiddleware("hospital"),
emergencyController.acceptEmergency
);

router.put(
"/reject/:id",
authMiddleware,
roleMiddleware("hospital"),
emergencyController.rejectEmergency
);

router.get(
"/my",
authMiddleware,
roleMiddleware("patient"),
emergencyController.getMyEmergency
);

module.exports = router;
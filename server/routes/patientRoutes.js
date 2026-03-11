const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const patientController = require("../controllers/patientController");

/* Patient Dashboard */

router.get(
"/dashboard",
authMiddleware,
roleMiddleware("patient"),
patientController.getDashboard
);

router.get(
"/hospitals",
authMiddleware,
roleMiddleware("patient"),
patientController.getHospitals
);

router.get(
"/donors",
authMiddleware,
roleMiddleware("patient"),
patientController.getDonors
);

module.exports = router;
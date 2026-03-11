const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const donorController = require("../controllers/donorController");

router.get(
"/dashboard",
authMiddleware,
roleMiddleware("donor"),
donorController.getDashboard
);

router.post(
"/update-availability",
authMiddleware,
roleMiddleware("donor"),
donorController.updateAvailability
);

router.get(
"/search",
authMiddleware,
roleMiddleware("patient"),
bloodDonorController.searchDonors
);

module.exports = router;
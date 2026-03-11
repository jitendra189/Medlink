const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const hospitalController = require("../controllers/hospitalDashboardController");

router.get(
"/dashboard",
authMiddleware,
roleMiddleware("hospital"),
hospitalController.getDashboard
);

router.post(
"/update-resources",
authMiddleware,
roleMiddleware("hospital"),
hospitalController.updateResources
);

module.exports = router;
const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const donorController = require("../controllers/bloodDonorController");


/* =========================
   DONOR DASHBOARD
========================= */

router.get(
"/dashboard",
authMiddleware,
roleMiddleware("donor"),
donorController.getDashboard
);


/* =========================
   UPDATE DONOR AVAILABILITY
========================= */

router.post(
"/update-availability",
authMiddleware,
roleMiddleware("donor"),
donorController.updateAvailability
);


/* =========================
   SEARCH BLOOD DONORS
========================= */

router.get(
"/search",
authMiddleware,
roleMiddleware("patient"),
donorController.searchDonors
);


module.exports = router;
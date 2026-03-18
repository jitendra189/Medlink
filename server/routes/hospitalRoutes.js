const express = require("express")
const router = express.Router()

const authMiddleware = require("../middleware/authMiddleware")
const hospitalController = require("../controllers/hospitalController")

router.get(
"/nearby",
authMiddleware,
hospitalController.getNearbyHospitals
)

router.post(
"/update-resources",
authMiddleware,
hospitalController.updateResources
)

module.exports = router
const express = require("express")
const router = express.Router()

const {

searchHospitals,
getHospitalDetails,
getHospitalResources,
getHospitalDoctors,
getNearbyHospitals

} = require("../controllers/hospitalSearchController")

/* SEARCH */
router.get("/search", searchHospitals)

/* NEARBY */
router.get("/nearby", getNearbyHospitals)

/* DETAILS */
router.get("/:id", getHospitalDetails)

/* RESOURCES */
router.get("/:id/resources", getHospitalResources)

/* DOCTORS */
router.get("/:id/doctors", getHospitalDoctors)

module.exports = router
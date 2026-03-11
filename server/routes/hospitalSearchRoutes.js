const express = require("express")
const router = express.Router()

const {
searchHospitals,
getHospitalDetails,
getHospitalResources,
getHospitalDoctors
} = require("../controllers/hospitalSearchController")

const auth = require("../middleware/authMiddleware")


/* SEARCH */

router.get("/search",auth,searchHospitals)


/* DETAILS */

router.get("/:id",auth,getHospitalDetails)


/* RESOURCES */

router.get("/:id/resources",auth,getHospitalResources)


/* DOCTORS */

router.get("/:id/doctors",auth,getHospitalDoctors)


module.exports = router
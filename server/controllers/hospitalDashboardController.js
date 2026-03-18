const Hospital = require("../models/Hospital")

/* =========================
   GET HOSPITAL DASHBOARD
========================= */

exports.getDashboard = async (req, res) => {

try {

const hospital = await Hospital.findOne({ admin: req.user.id })

if (!hospital) {
return res.status(404).json({
message: "Hospital not found"
})
}

/* send only required dashboard fields */

res.json({
name: hospital.name,
icuBeds: hospital.icuBeds || 0,
ventilators: hospital.ventilators || 0,
doctors: hospital.doctors || 0,
ambulances: hospital.ambulances || 0
})

} catch (error) {

res.status(500).json({
error: error.message
})

}

}


/* =========================
   UPDATE HOSPITAL RESOURCES
========================= */

exports.updateResources = async (req, res) => {

try {

const { icuBeds, ventilators, doctors, ambulances } = req.body

const hospital = await Hospital.findOne({ admin: req.user.id })

if (!hospital) {
return res.status(404).json({
message: "Hospital not found"
})
}

/* update only provided fields */

if (icuBeds !== undefined) hospital.icuBeds = icuBeds
if (ventilators !== undefined) hospital.ventilators = ventilators
if (doctors !== undefined) hospital.doctors = doctors
if (ambulances !== undefined) hospital.ambulances = ambulances

await hospital.save()

res.json({
message: "Resources updated successfully",
hospital
})

} catch (error) {

res.status(500).json({
error: error.message
})

}

}
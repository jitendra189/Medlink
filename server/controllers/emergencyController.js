const Emergency = require("../models/EmergencyRequest")
const Hospital = require("../models/Hospital")

/* =========================
   CREATE EMERGENCY (PATIENT SOS)
========================= */

exports.createEmergency = async (req,res)=>{
try{

const {lat,lng,type} = req.body

const emergency = await Emergency.create({
patient:req.user.id,
type:type || "ICU",
location:{lat,lng},
status:"pending"
})

/* REALTIME EVENT */

if(global.io){
global.io.emit("newEmergency",emergency)
}

res.json({
message:"Emergency request sent",
emergency
})

}catch(error){
res.status(500).json({error:error.message})
}
}


/* =========================
   GET ALL EMERGENCIES (HOSPITAL DASHBOARD)
========================= */

exports.getEmergencies = async (req,res)=>{
try{

const emergencies = await Emergency.find({status:"pending"})
.populate("patient","name email")
.populate("hospital","name")
.sort({createdAt:-1})

res.json(emergencies)

}catch(error){
res.status(500).json({error:error.message})
}
}


/* =========================
   ACCEPT EMERGENCY
========================= */

exports.acceptEmergency = async (req,res)=>{
try{

const hospital = await Hospital.findOne({
admin:req.user.id
})

const emergency = await Emergency.findById(req.params.id)

if(!emergency){
return res.status(404).json({message:"Emergency not found"})
}

emergency.status="accepted"
emergency.hospital=hospital._id

await emergency.save()

/* REALTIME UPDATE */

if(global.io){
global.io.emit("emergencyUpdated",emergency)
}

res.json({
message:"Emergency accepted",
emergency
})

}catch(error){
res.status(500).json({error:error.message})
}
}


/* =========================
   REJECT EMERGENCY
========================= */

exports.rejectEmergency = async (req,res)=>{
try{

const emergency = await Emergency.findById(req.params.id)

if(!emergency){
return res.status(404).json({message:"Emergency not found"})
}

emergency.status="rejected"

await emergency.save()

if(global.io){
global.io.emit("emergencyUpdated",emergency)
}

res.json({
message:"Emergency rejected",
emergency
})

}catch(error){
res.status(500).json({error:error.message})
}
}


/* =========================
   GET MY REQUESTS (PATIENT)
========================= */

exports.getMyEmergencies = async (req,res)=>{
try{

const emergencies = await Emergency.find({
patient:req.user.id
})
.populate("hospital","name")
.sort({createdAt:-1})

res.json(emergencies)

}catch(error){
res.status(500).json({error:error.message})
}
}


/* =========================
   CANCEL REQUEST (PATIENT)
========================= */

exports.cancelEmergency = async (req,res)=>{
try{

const emergency = await Emergency.findOne({
_id:req.params.id,
patient:req.user.id
})

if(!emergency){
return res.status(404).json({message:"Emergency not found"})
}

emergency.status="cancelled"

await emergency.save()

if(global.io){
global.io.emit("emergencyUpdated",emergency)
}

res.json({
message:"Emergency request cancelled"
})

}catch(error){
res.status(500).json({error:error.message})
}
}
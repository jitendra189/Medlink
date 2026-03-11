const Emergency = require("../models/EmergencyRequest")

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

res.json({
message:"Emergency request sent",
emergency
})

}catch(error){
res.status(500).json({error:error.message})
}
}


/* =========================
   GET ALL EMERGENCIES (HOSPITAL)
========================= */

exports.getEmergencies = async (req,res)=>{
try{

const emergencies = await Emergency.find()
.populate("patient","name email")
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

const emergency = await Emergency.findByIdAndUpdate(
req.params.id,
{status:"accepted"},
{new:true}
)

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

const emergency = await Emergency.findByIdAndUpdate(
req.params.id,
{status:"rejected"},
{new:true}
)

res.json({
message:"Emergency rejected",
emergency
})

}catch(error){
res.status(500).json({error:error.message})
}
}


/* =========================
   PATIENT CHECK STATUS
========================= */

exports.getMyEmergency = async (req,res)=>{
try{

const emergency = await Emergency.findOne({
patient:req.user.id
}).sort({createdAt:-1})

res.json(emergency)

}catch(error){
res.status(500).json({error:error.message})
}
}
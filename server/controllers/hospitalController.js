const Hospital = require("../models/Hospital")

/* =========================
   UPDATE RESOURCES
========================= */

exports.updateResources = async (req,res)=>{

try{

const hospitalId = req.user.id

const {icuBeds,doctors,ambulances} = req.body

const hospital = await Hospital.findOneAndUpdate(
{user:hospitalId},
{icuBeds,doctors,ambulances},
{new:true}
)

if(global.io){
global.io.emit("hospitalResourceUpdate",hospital)
}

res.json({
message:"Resources updated successfully",
hospital
})

}catch(error){

res.status(500).json({error:error.message})

}

}


/* =========================
   GET NEARBY HOSPITALS
========================= */

exports.getNearbyHospitals = async (req,res)=>{

try{

const hospitals = await Hospital.find({
icuBeds:{$gt:0}
}).select("name city icuBeds doctors ambulances location")

res.json(hospitals)

}catch(error){

res.status(500).json({error:error.message})

}

}
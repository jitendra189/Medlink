const Hospital = require("../models/Hospital")

/* =========================
   SEARCH HOSPITAL
========================= */

exports.searchHospitals = async (req,res)=>{

try{

const query = req.query.name || ""

const hospitals = await Hospital.find({
name: { $regex: query, $options: "i" }
})
.limit(10)

res.json(hospitals)

}catch(err){

res.status(500).json({error:err.message})

}

}


/* =========================
   GET HOSPITAL DETAILS
========================= */

exports.getHospitalDetails = async (req,res)=>{

try{

const hospital = await Hospital.findById(req.params.id)

if(!hospital){
return res.status(404).json({message:"Hospital not found"})
}

res.json(hospital)

}catch(err){

res.status(500).json({error:err.message})

}

}


/* =========================
   GET HOSPITAL RESOURCES
========================= */

exports.getHospitalResources = async (req,res)=>{

try{

const hospital = await Hospital.findById(req.params.id)

if(!hospital){
return res.status(404).json({message:"Hospital not found"})
}

res.json({
icuBeds:hospital.icuBeds,
doctors:hospital.doctors,
ambulances:hospital.ambulances
})

}catch(err){

res.status(500).json({error:err.message})

}

}


/* =========================
   GET DOCTORS
========================= */

exports.getHospitalDoctors = async (req,res)=>{

try{

/* mock doctor list for now */

const doctors = [
{
name:"Dr Sharma",
specialization:"Cardiologist",
availability:"Available"
},
{
name:"Dr Khan",
specialization:"Orthopedic",
availability:"Available"
},
{
name:"Dr Mehta",
specialization:"Neurologist",
availability:"Busy"
}
]

res.json(doctors)

}catch(err){

res.status(500).json({error:err.message})

}

}
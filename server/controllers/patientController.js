const Hospital = require("../models/Hospital");
const BloodDonor = require("../models/BloodDonor");

exports.getDashboard = async (req,res)=>{

try{

const hospitals = await Hospital.countDocuments();
const donors = await BloodDonor.countDocuments();

res.json({
message:"Patient dashboard data",
totalHospitals:hospitals,
totalDonors:donors
});

}catch(error){

res.status(500).json({error:error.message})

}

}


exports.getHospitals = async(req,res)=>{

try{

const hospitals = await Hospital.find()

res.json(hospitals)

}catch(error){

res.status(500).json({error:error.message})

}

}


exports.getDonors = async(req,res)=>{

try{

const donors = await BloodDonor.find()

res.json(donors)

}catch(error){

res.status(500).json({error:error.message})

}

}
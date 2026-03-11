const BloodDonor = require("../models/BloodDonor");

exports.getDashboard = async(req,res)=>{

try{

const donor = await BloodDonor.findOne({user:req.user.id})

res.json(donor)

}catch(error){

res.status(500).json({error:error.message})

}

}


exports.updateAvailability = async(req,res)=>{

try{

const {available} = req.body

const donor = await BloodDonor.findOneAndUpdate(

{user:req.user.id},

{available},

{new:true}

)

res.json({
message:"Availability updated",
donor
})

}catch(error){

res.status(500).json({error:error.message})

}

}

/* SEARCH DONORS */

exports.searchDonors = async(req,res)=>{

try{

const {bloodGroup} = req.query

const donors = await BloodDonor.find({

bloodGroup:bloodGroup,
available:true

}).populate("user","name email")

res.json(donors)

}catch(error){

res.status(500).json({error:error.message})

}

}
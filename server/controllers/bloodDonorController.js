const BloodDonor = require("../models/BloodDonor")


/* =========================
   DONOR DASHBOARD
========================= */

exports.getDashboard = async (req,res)=>{

try{

const donor = await BloodDonor.findOne({ user:req.user.id })
.populate("user","name email")

if(!donor){
return res.status(404).json({
message:"Donor profile not found"
})
}

res.json(donor)

}catch(error){

res.status(500).json({ error:error.message })

}

}


/* =========================
   UPDATE AVAILABILITY
========================= */

exports.updateAvailability = async (req,res)=>{

try{

const {available} = req.body

const donor = await BloodDonor.findOneAndUpdate(

{ user:req.user.id },

{ available },

{ new:true }

)

if(!donor){
return res.status(404).json({
message:"Donor profile not found"
})
}

res.json({
message:"Availability updated successfully",
donor
})

}catch(error){

res.status(500).json({ error:error.message })

}

}


/* =========================
   SEARCH DONORS
========================= */

exports.searchDonors = async (req,res)=>{

try{

const {bloodGroup,city} = req.query

if(!bloodGroup){
return res.status(400).json({
message:"Blood group is required"
})
}

const query = {
bloodGroup: { $regex: bloodGroup, $options:"i" },
available:true
}

if(city){
query.city = city
}

const donors = await BloodDonor.find(query)
.populate("user","name email")

res.json(donors)

}catch(error){

res.status(500).json({ error:error.message })

}

}
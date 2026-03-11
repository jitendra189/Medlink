const Hospital = require("../models/Hospital");

exports.getDashboard = async(req,res)=>{

try{

const hospital = await Hospital.findOne({admin:req.user.id})

res.json(hospital)

}catch(error){

res.status(500).json({error:error.message})

}

}


exports.updateResources = async(req,res)=>{

try{

const {icuBeds,doctors,ambulances} = req.body

const hospital = await Hospital.findOneAndUpdate(

{admin:req.user.id},

{
icuBeds,
doctors,
ambulances
},

{new:true}

)

res.json({
message:"Resources updated",
hospital
})

}catch(error){

res.status(500).json({error:error.message})

}

}
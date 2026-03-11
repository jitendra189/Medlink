const Hospital = require("../models/Hospital")

exports.updateResources = async (req,res)=>{

try{

const hospitalId = req.user.id

const {icuBeds,doctors,ambulances} = req.body

const hospital = await Hospital.findOneAndUpdate(
{user:hospitalId},
{icuBeds,doctors,ambulances},
{new:true}
)

/* REALTIME UPDATE */

global.io.emit("hospitalResourceUpdate",hospital)

res.json({
message:"Resources updated",
hospital
})

}catch(error){

res.status(500).json({error:error.message})

}

}
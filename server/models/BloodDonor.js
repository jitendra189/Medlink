const mongoose = require("mongoose")

const bloodDonorSchema = new mongoose.Schema({

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

bloodGroup:{
type:String,
required:true
},

phone:String,

available:{
type:Boolean,
default:true
},

location:{
lat:Number,
lng:Number
},

city:String

})

module.exports = mongoose.model("BloodDonor",bloodDonorSchema)
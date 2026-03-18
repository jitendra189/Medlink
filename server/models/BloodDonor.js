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

phone:{
type:String
},

city:{
type:String
},

available:{
type:Boolean,
default:true
},

location:{
lat:Number,
lng:Number
}

},{timestamps:true})

module.exports = mongoose.model("BloodDonor",bloodDonorSchema)
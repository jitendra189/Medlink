const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({

patient:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

type:{
type:String,
default:"ICU"
},

location:{
lat:Number,
lng:Number
},

status:{
type:String,
default:"pending"
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("EmergencyRequest", emergencySchema);
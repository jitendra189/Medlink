const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

location:{
type:String
},

icuBeds:{
type:Number,
default:0
},

doctors:{
type:Number,
default:0
},

ambulances:{
type:Number,
default:0
}

},{timestamps:true});

module.exports = mongoose.model("Hospital", hospitalSchema);
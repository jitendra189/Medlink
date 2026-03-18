const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({

name:String,

speciality:String,

distance:Number,

address:String,

phone:String,

image:String

});

module.exports = mongoose.model("Doctor",doctorSchema);
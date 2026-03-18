const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

city:{
type:String
},

description:{
type:String
},

contact:{
type:String
},

email:{
type:String
},

rating:{
type:Number,
default:4
},

photo:{
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
},

location:{
type:{
type:String,
enum:["Point"],
default:"Point"
},
coordinates:{
type:[Number],
required:true
}
}

},{timestamps:true})

/* GEO INDEX */
hospitalSchema.index({ location:"2dsphere" })

module.exports = mongoose.model("Hospital", hospitalSchema)
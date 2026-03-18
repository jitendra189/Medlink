const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

email:{
type:String,
required:true,
unique:false
},

password:{
type:String,
required:true
},

role:{
type:String,
enum:["patient","hospital","donor"],
required:true
}

},{timestamps:true})

module.exports = mongoose.model("User",userSchema)
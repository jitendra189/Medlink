const User = require("../models/User")
const generateToken = require("../utils/jwt")
const {hashPassword,comparePassword} = require("../utils/passwordHash")

/* =========================
REGISTER
========================= */

exports.register = async(req,res)=>{

try{

const {name,email,password,role} = req.body

if(!name || !email || !password || !role){
return res.status(400).json({
message:"All fields required"
})
}

/* check user */

const existing = await User.findOne({email,role})

if(existing){
return res.status(400).json({
message:"User already exists with this role"
})
}

/* hash password */

const hashed = await hashPassword(password)

/* create user */

const user = await User.create({
name,
email,
password:hashed,
role
})

const token = generateToken(user)

res.status(201).json({
message:"Registration successful",
token,
user
})

}catch(err){

console.log(err)

res.status(500).json({
message:"Server error"
})

}

}

/* =========================
LOGIN
========================= */

exports.login = async (req, res) => {

  try {

    const { email, password, role } = req.body;

    /* find user by email */

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    /* role check */

    if (user.role !== role) {
      return res.status(401).json({
        message: "Incorrect role selected"
      });
    }

    /* compare password */

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    /* generate token */

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error"
    });

  }

};

/* =========================
GET CURRENT USER
========================= */

exports.getMe = async(req,res)=>{

try{

const user = await User.findById(req.user.id).select("-password")

res.json(user)

}catch(err){

res.status(500).json({message:"Server error"})

}

}
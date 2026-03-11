const User = require("../models/User");
const generateToken = require("../utils/jwt");
const { hashPassword, comparePassword } = require("../utils/passwordHash");

exports.register = async (req, res) => {
  try {

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "User registered",
      token,
      user
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const match = await comparePassword(password, user.password);

    if (!match)
      return res.status(401).json({ message: "Invalid password" });

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
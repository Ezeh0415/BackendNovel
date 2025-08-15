const { getDB } = require("../models/db");
const bcrypt = require("bcrypt");
const User = require("../models/auth");
const generateTokens = require("../utils/generateTokens");

const saltRounds = 10;

const signup = async (req, res) => {
  const user = new User(req.body);
  const { username, email, password } = user;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  try {
    const db = getDB();

    // Check for existing user
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash the password
    const hash = await bcrypt.hash(password, saltRounds);

    // Create the user
    const result = await db.collection("users").insertOne({
      username,
      email,
      password: hash,
    });

    const newUser = result.ops
      ? result.ops[0]
      : await db.collection("users").findOne({ _id: result.insertedId });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: newUser._id,
      email: newUser.email,
    });

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Respond with user data (excluding password) + access token
    res.status(201).json({
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
      accessToken,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  try {
    const db = getDB();

    // Find the user by email
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
    });

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Respond with user data (excluding password) + access token
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },

      accessToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const logout = async (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "Strict" });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { signup, login, logout };

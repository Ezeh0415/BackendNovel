const { getDB } = require("../models/db");
const bcrypt = require("bcrypt");
const User = require("../models/auth");
const generateTokens = require("../utils/generateTokens");

const saltRounds = 10;

const signup = async (req, res) => {
  const user = new User(req.body);
  const { firstName, lastName, email, password } = user;

  if (!firstName || !lastName || !email || !password) {
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
      firstName,
      lastName,
      email,
      password: hash,
    });

    const newUser = result.ops
      ? result.ops[0]
      : await db.collection("users").findOne({ _id: result.insertedId });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      firstName: user.firstName,
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
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        likes: newUser.likes,
      },
      accessToken,
    });
  } catch (err) {
    console.error("Signup error:", err); // log full error for devs/admins
    res.status(500).json({ message: "Server error" });
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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        likes: user.likes,
      },

      accessToken,
    });
    console.log("successfully logged in");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const logout = async (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "Strict" });
  res.status(200).json({ message: "Logged out successfully" });
};

const novelLiked = async (req, res) => {
  const db = getDB();
  let likesArray = [];

  try {
    await db
      .collection("users")
      .find({}, { projection: { likes: 1, _id: 0 } }) // Only get 'likes', exclude '_id'
      .forEach((user) => {
        if (user.likes) likesArray.push(...user.likes); // Collect all likes from all users into one array
      });

    res.status(200).json({ data: likesArray });
  } catch (err) {
    console.error("Failed to get likes:", err);
    res.status(500).json({ error: "Failed to get likes" });
  }
};

module.exports = { signup, login, logout, novelLiked };

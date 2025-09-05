const { getDB } = require("../models/db");
const bcrypt = require("bcrypt");
const User = require("../models/auth");
const generateTokens = require("../utils/generateTokens");
const { ObjectId } = require("mongodb");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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

    function generateNumericOTP(length = 6) {
      let otp = "";
      for (let i = 0; i < length; i++) {
        otp += crypto.randomInt(0, 10); // 0-9
      }
      return otp;
    }

    // Example usage
    const otp = generateNumericOTP(); // e.g., "482739"

    // Hash the password
    const hash = await bcrypt.hash(password, saltRounds);

    // Create the user
    const result = await db.collection("users").insertOne({
      firstName,
      lastName,
      email,
      password: hash,
      otp: otp,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `NovelHub Account Verification Code`,
      html: `
    <p>Dear User,</p>
    <p>Your verification code is:</p>
    <h2 style="color:#2c3e50;">${otp}</h2>
    <p>Please enter this code within 10 minutes to verify your account.</p>
    <p>If you did not request this, please disregard this email.</p>
    <br/>
    <p>Thank you for choosing <strong>NovelHub</strong>.</p>
  `,
      text: `${otp} is your verification code.`,
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
        profileImg: newUser.userImage,
        subscribed: newUser.subscribed,
        otp: newUser.otp,
        messageId: info.messageId,
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
        profileImg: user.userImage,
        subscribed: user.subscribed,
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

// const userotp = async (req,res) => {
//   const email = req.body.email?.trim();
//   const db = getDB();
// }

const novelLiked = async (req, res) => {
  const userId = req.params.id;
  const db = getDB();
  let likesArray = [];
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    await db
      .collection("users")
      .find({ _id: new ObjectId(userId) }, { projection: { likes: 1, _id: 0 } }) // Only get 'likes', exclude '_id'
      .forEach((user) => {
        if (user.likes) likesArray.push(...user.likes); // Collect all likes from all users into one array
      });

    res.status(200).json({ data: likesArray });
  } catch (err) {
    console.error("Failed to get likes:", err);
    res.status(500).json({ error: "Failed to get likes" });
  }
};

const uploadImage = async (req, res) => {
  const email = req.body.email?.trim();
  const userImage = req.body.userImage?.trim();
  const db = getDB();

  if (!email || !userImage) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  try {
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.userImage === userImage) {
      return res
        .status(200)
        .json({ message: "This image is already set as your profile picture" });
    }

    const result = await db
      .collection("users")
      .updateOne({ email }, { $set: { userImage } });

    res.status(200).json({ message: "Profile image updated successfully" });
  } catch (err) {
    console.error("Failed to update user image:", err);
    res.status(500).json({ error: "Failed to update user image" });
  }
};

const subscribe = async (req, res) => {
  const email = req.body.email?.trim();
  const db = getDB();

  if (!email) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  try {
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await db
      .collection("users")
      .updateOne({ email }, { $set: { subscribed: !user.subscribed } });

    res
      .status(200)
      .json({ message: "Subscription updated successfully", result: result });
  } catch (err) {
    console.error("Failed to update user image:", err);
    res.status(500).json({ error: "Failed to update user image" });
  }
};

const getUserImg = async (req, res) => {
  const email = req.body.email?.trim();
  const db = getDB();

  if (!email) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  try {
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ userImage: user.userImage });
  } catch (err) {
    console.error("Failed to get user image:", err);
    res.status(500).json({ error: "Failed to get user image" });
  }
};

const deleteUser = async (req, res) => {
  const userId = req.body.id; // user ID of the user you want to remove
  const userEmail = req.body.email; // email of the user you want to remove
  const db = getDB();

  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  if (!userEmail) {
    return res.status(400).json({ error: "user email not found " });
  }

  console.log(userEmail, userId);

  try {
    const result = await db.collection("users").findOneAndDelete({
      _id: new ObjectId(userId),
      email: userEmail,
    });

    res.status(200).json({ message: "user deleted", user: result.value });
  } catch (err) {
    console.error("Failed to delete user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

module.exports = {
  signup,
  login,
  logout,
  novelLiked,
  uploadImage,
  getUserImg,
  subscribe,
  deleteUser,
};

const { getDB } = require("../models/db");
const bcrypt = require("bcrypt");
const generateTokens = require("../utils/generateTokens");
const { ObjectId } = require("mongodb");
const { sendOtpEmail } = require("../utils/mailer");
const generateNumericOTP = require("../utils/otp");
const { handleError } = require("../utils/ErrorHandler");

const saltRounds = 10;

// Utility: Centralized error handler
// function handleError(res, error, message = "Server error", status = 500) {
//   console.error(message, error);
//   return res.status(status).json({ message, error: error?.message });
// }

// Utility: OTP generator
// function generateNumericOTP(length = 6) {
//   let otp = "";
//   for (let i = 0; i < length; i++) {
//     otp += crypto.randomInt(0, 10);
//   }
//   return otp;
// }

// Utility: Nodemailer transporter
// function getTransporter() {
//   return nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false, // OK for port 587 (uses STARTTLS)
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//     tls: {
//       rejectUnauthorized: false,
//     },
//   });
// }

// // Utility: Send OTP email
// async function sendOtpEmail(email, otp) {
//   const transporter = getTransporter();
//   await transporter.verify();
//   return transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: `NovelHub Account Verification Code`,
//     html: `
//       <p>Dear User,</p>
//       <p>Your verification code is:</p>
//       <h2 style="color:#2c3e50;">${otp}</h2>
//       <p>Please enter this code within 10 minutes to verify your account.</p>
//       <p>If you did not request this, please disregard this email.</p>
//       <br/>
//       <p>Thank you for choosing <strong>NovelHub</strong>.</p>
//     `,
//     text: `${otp} is your verification code.`,
//   });
// }

// Signup Controller
const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
  try {
    const db = getDB();
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    const otp = generateNumericOTP();
    const hash = await bcrypt.hash(password, saltRounds);
    const otpHash = await bcrypt.hash(otp, saltRounds);
    const now = new Date();

    const result = await db.collection("users").insertOne({
      firstName,
      lastName,
      email,
      password: hash,
      otp: otpHash,
      otpCreatedAt: now,
      isVerified: false,
      likes: [],
      subscribed: false,
      userImage: "",
    });

    const newUser = await db.collection("users").findOne({ _id: result.insertedId });
    const { accessToken, refreshToken } = generateTokens({
      id: newUser._id,
      firstName: newUser.firstName,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        likes: newUser.likes,
        profileImg: newUser.userImage,
        subscribed: newUser.subscribed,
      },
      accessToken,
    });

    // Send OTP email (do not block response)
    sendOtpEmail(email, otp).catch((error) =>
      console.error("Error sending email:", error)
    );
  } catch (err) {
    handleError(res, err, "Signup error");
  }
};

// OTP Verification Controller
const otpHandler = async (req, res) => {
  const { email, otp: providedOtp } = req.body;
  if (!providedOtp || !email) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.otp) return res.status(400).json({ message: "No OTP found for this user" });

    const isOtpValid = await bcrypt.compare(providedOtp, user.otp);
    if (!isOtpValid) return res.status(401).json({ message: "Invalid OTP" });

    const now = new Date();
    const otpCreatedAt = new Date(user.otpCreatedAt);
    if (otpCreatedAt < new Date(now.getTime() - 5 * 60 * 1000)) {
      return res.status(401).json({ message: "OTP has expired" });
    }

    await db.collection("users").updateOne(
      { email },
      { $set: { isVerified: true }, $unset: { otp: "", otpCreatedAt: "" } }
    );
    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    handleError(res, err, "OTP verification error");
  }
};

// OTP Reset Controller
const otpReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(401).json({ message: "invalid credentials" });
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(404).json({ message: "user not found" });

    const otp = generateNumericOTP();
    const otpHash = await bcrypt.hash(otp, saltRounds);
    await db.collection("users").updateOne(
      { email },
      { $set: { isVerified: false, otp: otpHash, otpCreatedAt: new Date() } }
    );

    sendOtpEmail(email, otp).catch((error) =>
      console.error("Error sending email:", error)
    );
    return res.status(200).json({ message: "OTP resent successfully" });
  } catch (err) {
    handleError(res, err, "ERROR RESENDING OTP");
  }
};

// Login Controller
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });

    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
  } catch (err) {
    handleError(res, err, "Login error");
  }
};

// Logout Controller
const logout = async (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "Strict" });
  res.status(200).json({ message: "Logged out successfully" });
};

// Get User's Liked Novels
const novelLiked = async (req, res) => {
  const userId = req.params.id;
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  try {
    const db = getDB();
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { likes: 1, _id: 0 } }
    );
    res.status(200).json({ data: user?.likes || [] });
  } catch (err) {
    handleError(res, err, "Failed to get likes");
  }
};

// Upload Profile Image
const uploadImage = async (req, res) => {
  const email = req.body.email?.trim();
  const userImage = req.body.userImage?.trim();
  if (!email || !userImage) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.userImage === userImage) {
      return res.status(200).json({ message: "This image is already set as your profile picture" });
    }
    await db.collection("users").updateOne({ email }, { $set: { userImage } });
    res.status(200).json({ message: "Profile image updated successfully" });
  } catch (err) {
    handleError(res, err, "Failed to update user image");
  }
};

// Toggle Subscription
const subscribe = async (req, res) => {
  const email = req.body.email?.trim();
  if (!email) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const result = await db.collection("users").updateOne(
      { email },
      { $set: { subscribed: !user.subscribed } }
    );
    res.status(200).json({ message: "Subscription updated successfully", result });
  } catch (err) {
    handleError(res, err, "Failed to update subscription");
  }
};

// Get User Image
const getUserImg = async (req, res) => {
  const email = req.body.email?.trim();
  if (!email) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ userImage: user.userImage });
  } catch (err) {
    handleError(res, err, "Failed to get user image");
  }
};

// Delete User
const deleteUser = async (req, res) => {
  const userId = req.body.id;
  const userEmail = req.body.email;
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  if (!userEmail) {
    return res.status(400).json({ error: "user email not found" });
  }
  try {
    const db = getDB();
    const result = await db.collection("users").findOneAndDelete({
      _id: new ObjectId(userId),
      email: userEmail,
    });
    res.status(200).json({ message: "user deleted", user: result.value });
  } catch (err) {
    handleError(res, err, "Failed to delete user");
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
  otpHandler,
  otpReset,
};

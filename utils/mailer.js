// const nodemailer = require("nodemailer");
// const sendgridTransport = require("nodemailer-sendgrid");
require("dotenv").config();
const { Resend } = require("resend");

// function getTransporter() {
//   return nodemailer.createTransport(
//     sendgridTransport({
//       apiKey: process.env.SENDGRID_API_KEY,
//     })
//   );
// }

const resend = new Resend(process.env.RESEND_API_KEY);
async function sendOtpEmail(email, otp) {
  try {
    const { data, error } = await resend.emails.send({
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
    });
    if (error) {
      console.error("❌ Failed to send email:", error);
    } else {
      console.log("✅ Email sent:", data);
    }
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

module.exports = { sendOtpEmail };
// const transporter = getTransporter(); // <-- Call it here!

// const info = await transporter.sendMail({
//   to: email,
//   from: process.env.EMAIL_USER, // Must be a verified sender in SendGrid!
//   subject: `NovelHub Account Verification Code`,
// html: `
//   <p>Dear User,</p>
//   <p>Your verification code is:</p>
//   <h2 style="color:#2c3e50;">${otp}</h2>
//   <p>Please enter this code within 10 minutes to verify your account.</p>
//   <p>If you did not request this, please disregard this email.</p>
//   <br/>
//   <p>Thank you for choosing <strong>NovelHub</strong>.</p>
// `,
// });

// console.log("✅ OTP email sent:", info.messageId);
//  from: process.env.EMAIL_USER,
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

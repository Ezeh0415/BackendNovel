const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

async function sendOtpEmail(email, otp) {
  const transporter = getTransporter();
  await transporter.verify();
  return transporter.sendMail({
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
}

module.exports = { getTransporter, sendOtpEmail };

const Queue = require('bull');
const nodemailer = require('nodemailer');

const emailQueue = new Queue('email', {
  redis: { host: '127.0.0.1', port: 6379 }, // adjust if needed
});

// Create transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Process jobs from the queue
emailQueue.process(async (job) => {
  const { to, subject, html, text } = job.data;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    text,
  });

  return info; // return info for completion
});

module.exports = emailQueue;

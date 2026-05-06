const nodemailer = require('nodemailer');
const FROM = process.env.EMAIL_FROM || 'AI Blogger <noreply@aiblogger.io>';
const BASE = process.env.FRONTEND_URL || 'http://localhost:5500';

function getTransporter() {
  if (!process.env.SMTP_HOST) {
    return { sendMail: async (o) => console.log(`[EMAIL STUB] To:${o.to} | ${o.subject}`) };
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT)||587,
    secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const wrap = b => `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
  <div style="background:linear-gradient(135deg,#6C63FF,#4F9EFF);padding:20px;border-radius:12px;text-align:center;margin-bottom:24px">
    <h2 style="color:#fff;margin:0">AI Blogger</h2></div>${b}</div>`;

async function sendWelcome(email, name) {
  await getTransporter().sendMail({
    from: FROM, to: email, subject: '🚀 Welcome to AI Blogger!',
    html: wrap(`<h3>Welcome, ${name}!</h3><p style="color:#4A4A68">Your account is ready.</p>
    <a href="${BASE}/dashboard.html" style="display:inline-block;background:linear-gradient(135deg,#6C63FF,#4F9EFF);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard →</a>`),
  });
}

async function sendPasswordReset(email, name, token) {
  const url = `${BASE}/reset-password.html?token=${token}`;
  await getTransporter().sendMail({
    from: FROM, to: email, subject: '🔐 Reset Your Password',
    html: wrap(`<h3>Password Reset</h3><p style="color:#4A4A68">Hi ${name}, click below to reset your password. Expires in 1 hour.</p>
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#6C63FF,#4F9EFF);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password →</a>`),
  });
}

module.exports = { sendWelcome, sendPasswordReset };

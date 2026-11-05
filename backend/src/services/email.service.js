const nodemailer = require("nodemailer");
const { logger } = require("../utils/logger");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT) || 587, secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const templates = {
  emailVerification: ({ name, otp, expiresIn }) => ({
    subject: "FitKicks - Verify Your Email",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:12px">
      <h1 style="color:#FF6B35;font-size:28px;margin:0 0 8px">FitKicks 👟</h1>
      <h2>Welcome, ${name}!</h2>
      <p style="color:#ccc">Your OTP code:</p>
      <div style="background:#1a1a1a;border:2px solid #FF6B35;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-size:40px;font-weight:bold;color:#FF6B35;letter-spacing:12px">${otp}</span>
        <p style="color:#888;margin-top:8px;font-size:13px">Expires in ${expiresIn}</p>
      </div>
      <p style="color:#666;font-size:13px">If you didn't create an account, ignore this email.</p></div>`
  }),
  passwordReset: ({ name, resetUrl, expiresIn }) => ({
    subject: "FitKicks - Reset Your Password",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:12px">
      <h1 style="color:#FF6B35">FitKicks</h1>
      <h2>Reset Password</h2>
      <p style="color:#ccc">Hi ${name}, click below to reset your password:</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetUrl}" style="background:#FF6B35;color:#fff;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a>
      </div>
      <p style="color:#888;font-size:13px">Expires in ${expiresIn}. Ignore if you didn't request this.</p></div>`
  }),
  orderConfirmation: ({ name, orderNumber, totalAmount }) => ({
    subject: `FitKicks - Order Confirmed #${orderNumber}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:12px">
      <h1 style="color:#FF6B35">FitKicks</h1>
      <h2 style="color:#4CAF50">Order Confirmed! 🎉</h2>
      <p style="color:#ccc">Hi ${name}, your order <strong style="color:#FF6B35">#${orderNumber}</strong> is confirmed.</p>
      <p style="color:#ccc">Total: <strong>₹${totalAmount}</strong></p>
      <p style="color:#888;font-size:13px">You'll receive tracking info once it ships.</p></div>`
  }),
  orderStatusUpdate: ({ name, orderNumber, status }) => ({
    subject: `FitKicks - Order #${orderNumber} Status Update`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:12px">
      <h1 style="color:#FF6B35">FitKicks</h1>
      <h2>Order Update</h2>
      <p style="color:#ccc">Hi ${name}, order <strong>#${orderNumber}</strong> is now:</p>
      <div style="background:#FF6B35;border-radius:8px;padding:16px;text-align:center;margin:20px 0">
        <span style="color:#fff;font-weight:bold;font-size:18px;text-transform:uppercase">${status.replace(/_/g," ")}</span>
      </div></div>`
  }),
  passwordChanged: ({ name }) => ({
    subject: "FitKicks - Password Changed",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:12px">
      <h1 style="color:#FF6B35">FitKicks</h1>
      <h2 style="color:#4CAF50">Password Changed ✓</h2>
      <p style="color:#ccc">Hi ${name}, your password was changed. Contact support if this wasn't you.</p></div>`
  }),
};

const sendEmail = async ({ to, subject, template, data, html }) => {
  try {
    let content;
    if (template && templates[template]) { content = templates[template](data || {}); }
    else if (html) { content = { subject, html }; }
    else throw new Error("No template or HTML provided");
    const info = await transporter.sendMail({
      from: `${process.env.FROM_NAME || "FitKicks"} <${process.env.FROM_EMAIL}>`,
      to, subject: content.subject, html: content.html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error("Email error:", err.message);
    throw err;
  }
};

module.exports = { sendEmail };

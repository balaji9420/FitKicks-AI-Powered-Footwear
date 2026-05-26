const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User.model");
const { AppError, asyncHandler } = require("../utils/helpers");
const { sendEmail } = require("../services/email.service");
const { logger } = require("../utils/logger");

const generateTokens = (userId) => ({
  accessToken:  jwt.sign({ id: userId }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN  || "7d"  }),
  refreshToken: jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }),
});

const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const { accessToken, refreshToken } = generateTokens(user._id);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.status(statusCode).json({ success: true, message, accessToken, user: user.toSafeObject() });
};

exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, referralCode } = req.body;
  if (await User.findOne({ email })) throw new AppError("Email already registered", 409);
  const userData = { firstName, lastName, email, password, phone };
  if (referralCode) {
    const ref = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (ref) userData.referredBy = ref._id;
  }
  const user = await User.create(userData);
  const otp = user.generateEmailOTP();
  await user.save({ validateBeforeSave: false });
  await sendEmail({ to: user.email, template: "emailVerification", data: { name: user.firstName, otp, expiresIn: "10 minutes" } });
  logger.info(`New user registered: ${email}`);
  res.status(201).json({ success: true, message: "OTP sent to your email.", userId: user._id });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  const user = await User.findById(userId).select("+emailOTP +emailOTPExpiry");
  if (!user) throw new AppError("User not found", 404);
  if (user.isVerified) throw new AppError("Email already verified", 400);
  if (!user.emailOTP || user.emailOTP !== otp) throw new AppError("Invalid OTP", 400);
  if (user.emailOTPExpiry < new Date()) throw new AppError("OTP expired", 400);
  user.isVerified = true; user.emailOTP = undefined; user.emailOTPExpiry = undefined;
  if (user.referredBy) {
    await User.findByIdAndUpdate(user.referredBy, { $inc: { loyaltyPoints: 200 } });
    user.loyaltyPoints += 100;
  } else { user.loyaltyPoints += 50; }
  await user.save({ validateBeforeSave: false });
  sendTokenResponse(user, 200, res, "Email verified! Welcome to FitKicks.");
});

exports.resendOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body.userId).select("+emailOTP +emailOTPExpiry");
  if (!user) throw new AppError("User not found", 404);
  if (user.isVerified) throw new AppError("Already verified", 400);
  const otp = user.generateEmailOTP();
  await user.save({ validateBeforeSave: false });
  await sendEmail({ to: user.email, template: "emailVerification", data: { name: user.firstName, otp, expiresIn: "10 minutes" } });
  res.json({ success: true, message: "New OTP sent." });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError("Email and password required", 400);
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) throw new AppError("Invalid email or password", 401);
  if (!user.isActive) throw new AppError("Account suspended. Contact support.", 403);
  if (!user.isVerified) {
    return res.status(403).json({ success: false, message: "Verify your email first.", requiresVerification: true, userId: user._id });
  }
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  logger.info(`Login: ${email}`);
  sendTokenResponse(user, 200, res, "Login successful");
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.headers["x-refresh-token"];
  if (!token) throw new AppError("Refresh token not found", 401);
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET); }
  catch { throw new AppError("Invalid or expired refresh token", 401); }
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError("User not found", 401);
  const { accessToken, refreshToken: newRT } = generateTokens(user._id);
  res.cookie("refreshToken", newRT, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, accessToken });
});

exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out" });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const msg = "If that email is registered, a reset link has been sent.";
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: true, message: msg });
  const token = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await sendEmail({ to: user.email, template: "passwordReset", data: { name: user.firstName, resetUrl, expiresIn: "30 minutes" } });
  res.json({ success: true, message: msg });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpiry: { $gt: new Date() } }).select("+passwordResetToken +passwordResetExpiry");
  if (!user) throw new AppError("Invalid or expired reset token", 400);
  user.password = req.body.password;
  user.passwordResetToken = undefined; user.passwordResetExpiry = undefined;
  await user.save();
  await sendEmail({ to: user.email, template: "passwordChanged", data: { name: user.firstName } });
  sendTokenResponse(user, 200, res, "Password reset successful");
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) throw new AppError("Current password incorrect", 400);
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password changed" });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user: user.toSafeObject() });
});

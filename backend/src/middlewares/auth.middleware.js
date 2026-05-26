const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { AppError, asyncHandler } = require("../utils/helpers");
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) token = req.headers.authorization.split(" ")[1];
  else if (req.cookies?.accessToken) token = req.cookies.accessToken;
  if (!token) throw new AppError("Authentication required", 401);
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch (err) { throw new AppError(err.name === "TokenExpiredError" ? "Session expired" : "Invalid token", 401); }
  const user = await User.findById(decoded.id).select("-password");
  if (!user) throw new AppError("User not found", 401);
  if (!user.isActive) throw new AppError("Account deactivated", 403);
  req.user = user; next();
});
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) token = req.headers.authorization.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user && user.isActive) req.user = user;
    } catch {}
  }
  next();
});
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError("Authentication required", 401));
  if (!roles.includes(req.user.role)) return next(new AppError("Permission denied", 403));
  next();
};
exports.adminOnly = exports.authorize("admin");

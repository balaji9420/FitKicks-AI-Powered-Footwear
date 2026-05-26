const { logger } = require("../utils/logger");
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); this.statusCode = statusCode; this.isOperational = true;
  }
}
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({ success: false, message: err.message, stack: err.stack });
  } else {
    if (err.code === 11000) {
      err = new AppError("Duplicate field value", 409);
    } else if (err.name === "ValidationError") {
      const msgs = Object.values(err.errors).map(e => e.message).join(". ");
      err = new AppError(msgs, 400);
    } else if (err.name === "JsonWebTokenError") {
      err = new AppError("Invalid token", 401);
    } else if (err.name === "TokenExpiredError") {
      err = new AppError("Token expired", 401);
    }
    if (err.isOperational) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      logger.error("UNHANDLED:", err);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
};
module.exports = errorHandler;
module.exports.AppError = AppError;

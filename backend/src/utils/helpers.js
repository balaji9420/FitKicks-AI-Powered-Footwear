class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const getPaginationMeta = (total, page, limit) => ({
  total, page: parseInt(page), limit: parseInt(limit),
  pages: Math.ceil(total / limit),
  hasNext: page * limit < total, hasPrev: page > 1,
});
module.exports = { AppError, asyncHandler, getPaginationMeta };

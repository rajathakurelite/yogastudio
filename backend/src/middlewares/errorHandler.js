const AppError = require("../utils/AppError");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.statusCode || 500;
  const payload = {
    success: false,
    code: err.code || "INTERNAL_ERROR",
    message:
      status >= 500
        ? "Something went wrong. Please try again."
        : err.message || "Request failed",
  };
  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== "production" && status >= 500) {
    payload.debug = err.message;
  }
  res.status(status).json(payload);
}

function notFound(req, res, next) {
  next(new AppError(404, "Not found", "NOT_FOUND"));
}

module.exports = { errorHandler, notFound };

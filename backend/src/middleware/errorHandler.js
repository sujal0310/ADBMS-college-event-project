/**
 * Operational application error with HTTP status code and optional details.
 */
class AppError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Wraps async route/controller handlers so rejected promises forward to Express error middleware.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Fallback 404 handler for unmatched `/api/*` routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

/**
 * Central Express error handler translating AppError and MongoDB driver errors
 * into clean JSON responses.
 */
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    const payload = { error: err.message };
    if (err.details !== undefined) payload.details = err.details;
    return res.status(err.statusCode).json(payload);
  }

  // MongoDB duplicate key error
  if (err && err.code === 11000) {
    const fields = err.keyPattern ? Object.keys(err.keyPattern).join(", ") : "unique field";
    return res.status(409).json({
      error: `Duplicate value for ${fields}`
    });
  }

  // MongoDB $jsonSchema document validation failure
  if (err && err.code === 121) {
    return res.status(400).json({
      error: "Document failed schema validation",
      details: err.errInfo || undefined
    });
  }

  console.error("[Server Error]", err);
  return res.status(500).json({ error: "Internal server error" });
}

module.exports = {
  AppError,
  asyncHandler,
  notFoundHandler,
  errorHandler
};

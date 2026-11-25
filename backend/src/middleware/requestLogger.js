/**
 * Lightweight request logger for API observability.
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    if (req.originalUrl.startsWith("/api")) {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
    }
  });
  next();
}

module.exports = { requestLogger };

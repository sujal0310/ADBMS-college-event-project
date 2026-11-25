const { AppError } = require("./errorHandler");

function requireNonEmptyStrings(source, fields) {
  const missing = fields.filter((field) => {
    const val = source[field];
    return typeof val !== "string" || val.trim().length === 0;
  });
  if (missing.length > 0) {
    throw new AppError(400, `Missing or invalid required fields: ${missing.join(", ")}`);
  }
}

function parseIntInRange(value, fieldName, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new AppError(400, `${fieldName} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

function parseNonNegativeNumber(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(400, `${fieldName} must be a non-negative number`);
  }
  return parsed;
}

function parseEnum(value, allowed, fieldName) {
  if (!allowed.includes(value)) {
    throw new AppError(400, `${fieldName} must be one of: ${allowed.join(", ")}`);
  }
  return value;
}

module.exports = {
  requireNonEmptyStrings,
  parseIntInRange,
  parseNonNegativeNumber,
  parseEnum
};

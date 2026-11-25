const path = require("path");
const fs = require("fs");

/**
 * Lightweight .env loader (avoids external dotenv dependency).
 * Reads backend/.env if present without overriding existing process.env vars.
 */
function loadEnvFile() {
  const envPath = path.resolve(__dirname, "..", "..", ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const val = line.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadEnvFile();

const env = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017",
  dbName: process.env.DB_NAME || "campus_events",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  autoSeed: process.env.AUTO_SEED === "true",
  frontendDir: process.env.FRONTEND_DIR
    ? path.resolve(process.env.FRONTEND_DIR)
    : path.resolve(__dirname, "..", "..", "..", "frontend")
};

module.exports = env;

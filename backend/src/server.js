const env = require("./config/env");
const { connectDB, closeDB } = require("./config/db");
const { ensureSchemaAndIndexes } = require("./db/schemaAndIndexes");
const { seedDatabase } = require("./db/seedData");
const { createApp } = require("./app");

let server;

async function start() {
  const db = await connectDB(env.mongoUri, env.dbName);
  await ensureSchemaAndIndexes(db);

  if (env.autoSeed) {
    const result = await seedDatabase(db, { ifEmptyOnly: true });
    if (!result.skipped) {
      console.log(
        `Auto-seeded campus_events: ${result.clubs} clubs, ${result.events} events, ${result.registrations} registrations`
      );
    }
  }

  const app = createApp();
  server = app.listen(env.port, () => {
    console.log(`Connected to MongoDB (${env.mongoUri}/${env.dbName})`);
    console.log(`Smart Campus Event Hub backend running at http://localhost:${env.port}`);
  });
}

async function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDB();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

if (require.main === module) {
  start().catch((err) => {
    console.error("Failed to start backend server:", err);
    process.exit(1);
  });
}

module.exports = { start, shutdown };

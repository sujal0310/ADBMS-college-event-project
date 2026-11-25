const env = require("../config/env");
const { connectDB, closeDB } = require("../config/db");
const { seedDatabase } = require("../db/seedData");

async function main() {
  const ifEmptyOnly = process.argv.includes("--if-empty");
  const db = await connectDB(env.mongoUri, env.dbName);
  const summary = await seedDatabase(db, { ifEmptyOnly });
  console.log("Seed result:", summary);
  await closeDB();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  await closeDB().catch(() => {});
  process.exit(1);
});

const env = require("../config/env");
const { getDB, isTransactionSupported } = require("../config/db");
const { seedDatabase } = require("../db/seedData");
const { asyncHandler } = require("../middleware/errorHandler");

const getHealth = asyncHandler(async (_req, res) => {
  try {
    const db = getDB();
    await db.command({ ping: 1 });
    res.json({
      status: "ok",
      database: env.dbName,
      transactionsSupported: isTransactionSupported(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      message: err.message
    });
  }
});

const runSeed = asyncHandler(async (req, res) => {
  const db = getDB();
  const ifEmptyOnly = Boolean(req.body && req.body.ifEmptyOnly);
  const summary = await seedDatabase(db, { ifEmptyOnly });
  res.status(summary.skipped ? 200 : 201).json({
    message: summary.skipped ? "Database already seeded" : "Database seeded successfully",
    ...summary
  });
});

module.exports = {
  getHealth,
  runSeed
};

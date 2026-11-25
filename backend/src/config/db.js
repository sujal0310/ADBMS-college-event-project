const { MongoClient } = require("mongodb");
const env = require("./env");

let client = null;
let database = null;
let supportsTransactions = false;

/**
 * Connects to MongoDB, caches the database handle, and detects replica set
 * transaction capability so booking can use ACID sessions when supported.
 */
async function connectDB(uri = env.mongoUri, dbName = env.dbName) {
  if (database) return database;

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(dbName);

  try {
    const hello = await database.admin().command({ hello: 1 });
    supportsTransactions = Boolean(hello.setName || hello.msg === "isdbgrid");
  } catch {
    supportsTransactions = false;
  }

  return database;
}

/**
 * Returns the active MongoDB Db instance or throws if not connected.
 */
function getDB() {
  if (!database) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return database;
}

/**
 * Allows injecting a mock or test Db instance (useful for isolated tests).
 */
function setDB(customDb, options = {}) {
  database = customDb;
  supportsTransactions = Boolean(options.supportsTransactions);
}

/**
 * Returns the underlying MongoClient instance.
 */
function getClient() {
  return client;
}

/**
 * Whether the connected MongoDB topology supports multi-document transactions.
 */
function isTransactionSupported() {
  return Boolean(client && supportsTransactions);
}

/**
 * Gracefully closes the MongoDB connection.
 */
async function closeDB() {
  if (client) {
    await client.close();
    client = null;
  }
  database = null;
  supportsTransactions = false;
}

module.exports = {
  connectDB,
  getDB,
  setDB,
  getClient,
  isTransactionSupported,
  closeDB
};

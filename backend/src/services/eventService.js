const { Int32 } = require("mongodb");
const { getDB } = require("../config/db");
const { AppError } = require("../middleware/errorHandler");
const {
  requireNonEmptyStrings,
  parseIntInRange,
  parseNonNegativeNumber,
  parseEnum
} = require("../middleware/validate");

const EVENT_CATEGORIES = ["Technical", "Cultural", "Sports", "Workshop", "Seminar"];

/**
 * Discovers events using Task 2 filters:
 * - ?free=true (entryFee: 0)
 * - ?minSeats=50 (seatsAvailable > 50)
 * - ?tags=coding,hackathon (tags: { $in: [...] })
 * - ?category=Technical
 * - ?club=Coding Club | ?clubId=CLUB-CODE
 * - ?search=keyword (matches title, venue, or organizerClub)
 */
async function listEvents(query = {}) {
  const db = getDB();
  const filter = {};

  if (query.free === "true") {
    filter.entryFee = 0;
  }

  if (query.minSeats !== undefined && query.minSeats !== "") {
    const minSeats = Number(query.minSeats);
    if (!Number.isFinite(minSeats)) {
      throw new AppError(400, "minSeats must be a valid number");
    }
    filter.seatsAvailable = { $gt: minSeats };
  }

  if (query.tags) {
    const tagList = String(query.tags)
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (tagList.length > 0) {
      filter.tags = { $in: tagList };
    }
  }

  if (query.category) {
    filter.category = String(query.category);
  }

  if (query.clubId) {
    filter.clubId = String(query.clubId);
  }

  if (query.club) {
    filter.organizerClub = String(query.club);
  }

  if (query.search) {
    const regex = new RegExp(String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: regex }, { venue: regex }, { organizerClub: regex }];
  }

  return db.collection("events").find(filter).sort({ date: 1 }).toArray();
}

/**
 * Returns a single event by ID along with live registration counts.
 */
async function getEventById(eventId) {
  const db = getDB();
  const event = await db.collection("events").findOne({ _id: eventId });
  if (!event) {
    throw new AppError(404, `Event "${eventId}" not found`);
  }

  const [totalRegistrations, checkedInCount] = await Promise.all([
    db.collection("registrations").countDocuments({ eventId }),
    db.collection("registrations").countDocuments({ eventId, checkInStatus: true })
  ]);

  return {
    ...event,
    stats: {
      totalRegistrations,
      checkedInCount
    }
  };
}

/**
 * Creates a new event document compliant with Phase 1 schema.
 */
async function createEvent(payload) {
  const db = getDB();
  requireNonEmptyStrings(payload, ["_id", "title", "category", "organizerClub", "venue", "date"]);
  parseEnum(payload.category, EVENT_CATEGORIES, "category");

  const capacity = parseIntInRange(payload.capacity, "capacity", 1, 100000);
  const seatsAvailable =
    payload.seatsAvailable !== undefined
      ? parseIntInRange(payload.seatsAvailable, "seatsAvailable", 0, capacity)
      : capacity;
  const entryFee = parseNonNegativeNumber(payload.entryFee ?? 0, "entryFee");

  const parsedDate = new Date(payload.date);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(400, "date must be a valid ISO-8601 date string");
  }

  if (!Array.isArray(payload.coordinators) || payload.coordinators.length === 0) {
    throw new AppError(400, "coordinators must be a non-empty array of { name, contact }");
  }
  for (const coord of payload.coordinators) {
    if (!coord || typeof coord !== "object") {
      throw new AppError(400, "Each coordinator must be an object with name and contact");
    }
    requireNonEmptyStrings(coord, ["name", "contact"]);
  }

  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : [];
  const sponsors = Array.isArray(payload.sponsors)
    ? [...new Set(payload.sponsors.map((s) => String(s).trim()).filter(Boolean))]
    : [];

  const doc = {
    _id: payload._id.trim(),
    title: payload.title.trim(),
    category: payload.category,
    ...(payload.clubId ? { clubId: String(payload.clubId).trim() } : {}),
    organizerClub: payload.organizerClub.trim(),
    venue: payload.venue.trim(),
    date: parsedDate,
    capacity: new Int32(capacity),
    seatsAvailable: new Int32(seatsAvailable),
    entryFee,
    tags,
    coordinators: payload.coordinators.map((c) => ({
      name: c.name.trim(),
      contact: c.contact.trim()
    })),
    sponsors
  };

  await db.collection("events").insertOne(doc);
  return doc;
}

/**
 * Updates mutable metadata fields on an existing event (venue, date, entryFee, tags).
 */
async function updateEvent(eventId, payload) {
  const db = getDB();
  const updates = {};

  if (payload.title !== undefined) {
    requireNonEmptyStrings(payload, ["title"]);
    updates.title = payload.title.trim();
  }
  if (payload.venue !== undefined) {
    requireNonEmptyStrings(payload, ["venue"]);
    updates.venue = payload.venue.trim();
  }
  if (payload.date !== undefined) {
    const parsed = new Date(payload.date);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError(400, "date must be a valid ISO-8601 date string");
    }
    updates.date = parsed;
  }
  if (payload.entryFee !== undefined) {
    updates.entryFee = parseNonNegativeNumber(payload.entryFee, "entryFee");
  }
  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags)) {
      throw new AppError(400, "tags must be an array of strings");
    }
    updates.tags = payload.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError(400, "No valid fields provided for update");
  }

  const updated = await db.collection("events").findOneAndUpdate(
    { _id: eventId },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!updated) {
    throw new AppError(404, `Event "${eventId}" not found`);
  }
  return updated;
}

/**
 * Task 3.3: Dynamically pushes a sponsor to an event without duplication via $addToSet.
 */
async function addSponsor(eventId, sponsorName) {
  const db = getDB();
  if (!sponsorName || typeof sponsorName !== "string" || !sponsorName.trim()) {
    throw new AppError(400, "sponsor string is required");
  }

  const updated = await db.collection("events").findOneAndUpdate(
    { _id: eventId },
    { $addToSet: { sponsors: sponsorName.trim() } },
    { returnDocument: "after" }
  );

  if (!updated) {
    throw new AppError(404, `Event "${eventId}" not found`);
  }

  return updated;
}

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  addSponsor
};

const { Int32 } = require("mongodb");
const { getDB } = require("../config/db");
const { AppError } = require("../middleware/errorHandler");
const {
  requireNonEmptyStrings,
  parseIntInRange,
  parseNonNegativeNumber,
  parseEnum
} = require("../middleware/validate");

const CLUB_CATEGORIES = ["Technical", "Cultural", "Sports", "Literary", "Social"];
const MEMBER_ROLES = ["Member", "Core", "Coordinator", "President"];

/**
 * Lists all clubs, optionally filtered by category, department, or member studentId.
 */
async function listClubs(query = {}) {
  const db = getDB();
  const filter = {};

  if (query.category) filter.category = String(query.category);
  if (query.department) filter.department = String(query.department);
  if (query.studentId) filter["members.studentId"] = String(query.studentId);

  return db.collection("clubs").find(filter).sort({ name: 1 }).toArray();
}

/**
 * Fetches a single club along with events it organizes.
 */
async function getClubById(clubId) {
  const db = getDB();
  const club = await db.collection("clubs").findOne({ _id: clubId });
  if (!club) {
    throw new AppError(404, `Club "${clubId}" not found`);
  }

  const events = await db
    .collection("events")
    .find({ $or: [{ clubId }, { organizerClub: club.name }] })
    .sort({ date: 1 })
    .toArray();

  return { ...club, events };
}

/**
 * Creates a new campus club document.
 */
async function createClub(payload) {
  const db = getDB();
  requireNonEmptyStrings(payload, ["_id", "name", "category", "department"]);

  if (!payload.lead || typeof payload.lead !== "object") {
    throw new AppError(400, "lead object with name, studentId, and email is required");
  }
  requireNonEmptyStrings(payload.lead, ["name", "studentId", "email"]);
  parseEnum(payload.category, CLUB_CATEGORIES, "category");

  const leadMember = {
    studentId: payload.lead.studentId.trim(),
    name: payload.lead.name.trim(),
    department: payload.department.trim(),
    year: new Int32(parseIntInRange(payload.lead.year ?? 3, "lead.year", 1, 5)),
    role: "President"
  };

  const doc = {
    _id: payload._id.trim(),
    name: payload.name.trim(),
    category: payload.category,
    department: payload.department.trim(),
    facultyAdvisor: payload.facultyAdvisor ? String(payload.facultyAdvisor).trim() : "TBD",
    lead: {
      name: payload.lead.name.trim(),
      studentId: payload.lead.studentId.trim(),
      email: payload.lead.email.trim()
    },
    members: Array.isArray(payload.members) && payload.members.length > 0 ? payload.members : [leadMember],
    annualBudget: parseNonNegativeNumber(payload.annualBudget ?? 0, "annualBudget"),
    active: payload.active !== undefined ? Boolean(payload.active) : true
  };

  await db.collection("clubs").insertOne(doc);
  return doc;
}

/**
 * Atomically adds a student member to a club if not already enrolled.
 */
async function addClubMember(clubId, payload) {
  const db = getDB();
  requireNonEmptyStrings(payload, ["studentId", "name", "department"]);

  const year = parseIntInRange(payload.year, "year", 1, 5);
  const role = parseEnum(payload.role || "Member", MEMBER_ROLES, "role");
  const studentId = payload.studentId.trim();

  const club = await db.collection("clubs").findOne({ _id: clubId });
  if (!club) {
    throw new AppError(404, `Club "${clubId}" not found`);
  }

  const member = {
    studentId,
    name: payload.name.trim(),
    department: payload.department.trim(),
    year: new Int32(year),
    role
  };

  const result = await db.collection("clubs").updateOne(
    { _id: clubId, "members.studentId": { $ne: studentId } },
    { $push: { members: member } }
  );

  if (result.matchedCount === 0) {
    throw new AppError(409, `Student "${studentId}" is already a member of club "${clubId}"`);
  }

  return member;
}

/**
 * Removes a student member from a club by studentId.
 */
async function removeClubMember(clubId, studentId) {
  const db = getDB();
  const result = await db.collection("clubs").updateOne(
    { _id: clubId, "members.studentId": studentId },
    { $pull: { members: { studentId } } }
  );

  if (result.matchedCount === 0) {
    throw new AppError(404, `Club "${clubId}" or member "${studentId}" not found`);
  }
}

module.exports = {
  listClubs,
  getClubById,
  createClub,
  addClubMember,
  removeClubMember
};

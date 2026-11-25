const crypto = require("crypto");
const { Int32 } = require("mongodb");
const { getDB, getClient, isTransactionSupported } = require("../config/db");
const { AppError } = require("../middleware/errorHandler");
const {
  requireNonEmptyStrings,
  parseIntInRange,
  parseEnum
} = require("../middleware/validate");

const PAID_METHODS = ["UPI", "Card", "Cash", "NetBanking"];

/**
 * Generates a unique human-readable ticket code such as TICK-2026-4829A1.
 */
function generateTicketId() {
  const year = new Date().getUTCFullYear();
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TICK-${year}-${suffix}`;
}

/**
 * Task 2.3 & Registration Lookup:
 * Supports filtering by department, eventId, ticketId, studentId, checkInStatus.
 */
async function listRegistrations(query = {}) {
  const db = getDB();
  const filter = {};

  if (query.department) filter.department = String(query.department);
  if (query.eventId) filter.eventId = String(query.eventId);
  if (query.ticketId) filter.ticketId = String(query.ticketId);
  if (query.studentId) filter.studentId = String(query.studentId);
  if (query.checkInStatus !== undefined && query.checkInStatus !== "") {
    filter.checkInStatus = query.checkInStatus === "true" || query.checkInStatus === true;
  }

  return db.collection("registrations").find(filter).sort({ registrationDate: -1 }).toArray();
}

/**
 * Fetches a single ticket registration by ticketId.
 */
async function getRegistrationByTicketId(ticketId) {
  const db = getDB();
  const registration = await db.collection("registrations").findOne({ ticketId });
  if (!registration) {
    throw new AppError(404, `Ticket "${ticketId}" not found`);
  }
  return registration;
}

/**
 * Builds the validated registration document using server-authoritative event pricing.
 */
function buildRegistrationDoc(payload, event) {
  const year = parseIntInRange(payload.year, "year", 1, 5);
  const method =
    event.entryFee === 0
      ? "Free"
      : parseEnum(payload.paymentMethod || "UPI", PAID_METHODS, "paymentMethod");

  return {
    ticketId: generateTicketId(),
    eventId: event._id,
    studentId: payload.studentId.trim(),
    studentName: payload.studentName.trim(),
    department: payload.department.trim(),
    year: new Int32(year),
    registrationDate: new Date(),
    checkInStatus: false,
    checkedInAt: null,
    paymentDetails: {
      method,
      amountPaid: event.entryFee,
      status: "Completed"
    }
  };
}

/**
 * Task 3.1: Atomic seat booking + registration insert.
 * Uses a MongoDB multi-document transaction on replica sets, and falls back to
 * guarded atomic `$inc` with compensating rollback on standalone MongoDB instances.
 */
async function bookTicket(payload) {
  requireNonEmptyStrings(payload, ["eventId", "studentId", "studentName", "department"]);
  parseIntInRange(payload.year, "year", 1, 5);

  const db = getDB();
  const eventId = payload.eventId.trim();
  const studentId = payload.studentId.trim();

  if (isTransactionSupported()) {
    const session = getClient().startSession();
    let resultPayload;
    try {
      await session.withTransaction(async () => {
        const updatedEvent = await db.collection("events").findOneAndUpdate(
          { _id: eventId, seatsAvailable: { $gt: 0 } },
          { $inc: { seatsAvailable: new Int32(-1) } },
          { returnDocument: "after", session }
        );

        if (!updatedEvent) {
          const exists = await db.collection("events").findOne({ _id: eventId }, { session });
          throw new AppError(exists ? 409 : 404, exists ? "Event is sold out" : `Event "${eventId}" not found`);
        }

        const registrationDoc = buildRegistrationDoc(payload, updatedEvent);
        await db.collection("registrations").insertOne(registrationDoc, { session });

        resultPayload = {
          ticket: registrationDoc,
          seatsRemaining: Number(updatedEvent.seatsAvailable)
        };
      });
      return resultPayload;
    } catch (err) {
      if (err && err.code === 11000) {
        throw new AppError(409, `Student "${studentId}" is already registered for event "${eventId}"`);
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // Standalone MongoDB path: atomic predicate + $inc with compensating rollback
  const updatedEvent = await db.collection("events").findOneAndUpdate(
    { _id: eventId, seatsAvailable: { $gt: 0 } },
    { $inc: { seatsAvailable: new Int32(-1) } },
    { returnDocument: "after" }
  );

  if (!updatedEvent) {
    const exists = await db.collection("events").findOne({ _id: eventId });
    throw new AppError(exists ? 409 : 404, exists ? "Event is sold out" : `Event "${eventId}" not found`);
  }

  const registrationDoc = buildRegistrationDoc(payload, updatedEvent);

  try {
    await db.collection("registrations").insertOne(registrationDoc);
  } catch (insertErr) {
    // Compensate atomic seat decrement if insert fails (e.g. duplicate eventId+studentId)
    await db.collection("events").updateOne(
      { _id: eventId },
      { $inc: { seatsAvailable: new Int32(1) } }
    );
    if (insertErr && insertErr.code === 11000) {
      throw new AppError(409, `Student "${studentId}" is already registered for event "${eventId}"`);
    }
    throw insertErr;
  }

  return {
    ticket: registrationDoc,
    seatsRemaining: Number(updatedEvent.seatsAvailable)
  };
}

/**
 * Task 3.2: Idempotent venue gate check-in for a ticket.
 */
async function checkInTicket(ticketId) {
  const db = getDB();
  const now = new Date();

  const updated = await db.collection("registrations").findOneAndUpdate(
    { ticketId, checkInStatus: false },
    { $set: { checkInStatus: true, checkedInAt: now } },
    { returnDocument: "after" }
  );

  if (!updated) {
    const existing = await db.collection("registrations").findOne({ ticketId });
    if (!existing) {
      throw new AppError(404, `Ticket "${ticketId}" not found`);
    }
    throw new AppError(409, "Ticket already checked in", {
      checkedInAt: existing.checkedInAt
    });
  }

  return updated;
}

/**
 * Cancels an unchecked-in ticket and atomically restores 1 seat to the event.
 */
async function cancelTicket(ticketId) {
  const db = getDB();
  const deleted = await db.collection("registrations").findOneAndDelete({
    ticketId,
    checkInStatus: false
  });

  if (!deleted) {
    const existing = await db.collection("registrations").findOne({ ticketId });
    if (!existing) {
      throw new AppError(404, `Ticket "${ticketId}" not found`);
    }
    throw new AppError(409, "Cannot cancel a ticket that has already been checked in");
  }

  await db.collection("events").updateOne(
    { _id: deleted.eventId },
    { $inc: { seatsAvailable: new Int32(1) } }
  );

  return deleted;
}

module.exports = {
  listRegistrations,
  getRegistrationByTicketId,
  bookTicket,
  checkInTicket,
  cancelTicket
};

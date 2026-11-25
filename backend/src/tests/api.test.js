const test = require("node:test");
const assert = require("node:assert/strict");
const { setDB } = require("../config/db");
const { buildSeedData } = require("../db/seedData");
const { createApp } = require("../app");

/**
 * Minimal in-memory MongoDB collection double supporting the query, update,
 * and index constraints exercised by the backend API tests.
 */
function createMockDB() {
  const seed = buildSeedData();
  const state = {
    clubs: seed.clubs.map((c) => structuredClone({ ...c, members: c.members.map((m) => ({ ...m, year: Number(m.year) })) })),
    events: seed.events.map((e) =>
      structuredClone({ ...e, capacity: Number(e.capacity), seatsAvailable: Number(e.seatsAvailable) })
    ),
    registrations: seed.registrations.map((r) =>
      structuredClone({ ...r, year: Number(r.year) })
    )
  };

  function matches(doc, filter = {}) {
    return Object.entries(filter).every(([key, cond]) => {
      const value = key.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), doc);
      if (cond && typeof cond === "object" && !Array.isArray(cond) && !(cond instanceof Date) && !(cond instanceof RegExp)) {
        if ("$gt" in cond) return Number(value) > Number(cond.$gt);
        if ("$ne" in cond) {
          if (Array.isArray(doc.members) && key === "members.studentId") {
            return !doc.members.some((m) => m.studentId === cond.$ne);
          }
          return value !== cond.$ne;
        }
        if ("$in" in cond) {
          if (Array.isArray(value)) return value.some((v) => cond.$in.includes(v));
          return cond.$in.includes(value);
        }
      }
      if (cond instanceof RegExp) return cond.test(String(value || ""));
      return value === cond;
    });
  }

  function applyUpdate(doc, update) {
    if (update.$inc) {
      for (const [k, delta] of Object.entries(update.$inc)) {
        doc[k] = Number(doc[k]) + Number(delta);
      }
    }
    if (update.$set) {
      for (const [k, v] of Object.entries(update.$set)) {
        doc[k] = v;
      }
    }
    if (update.$addToSet) {
      for (const [k, v] of Object.entries(update.$addToSet)) {
        if (!Array.isArray(doc[k])) doc[k] = [];
        if (!doc[k].includes(v)) doc[k].push(v);
      }
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        if (!Array.isArray(doc[k])) doc[k] = [];
        doc[k].push(v);
      }
    }
  }

  function makeCollection(name) {
    return {
      find(filter = {}) {
        const list = state[name].filter((d) => matches(d, filter));
        return {
          sort() { return this; },
          async toArray() { return list.map((d) => structuredClone(d)); }
        };
      },
      async findOne(filter = {}) {
        const doc = state[name].find((d) => matches(d, filter));
        return doc ? structuredClone(doc) : null;
      },
      async countDocuments(filter = {}) {
        return state[name].filter((d) => matches(d, filter)).length;
      },
      async insertOne(doc) {
        if (name === "registrations") {
          const dup = state.registrations.find(
            (r) => r.ticketId === doc.ticketId || (r.eventId === doc.eventId && r.studentId === doc.studentId)
          );
          if (dup) {
            const err = new Error("E11000 duplicate key");
            err.code = 11000;
            throw err;
          }
        }
        const clone = structuredClone(doc);
        if (clone.year !== undefined) clone.year = Number(clone.year);
        if (clone.capacity !== undefined) clone.capacity = Number(clone.capacity);
        if (clone.seatsAvailable !== undefined) clone.seatsAvailable = Number(clone.seatsAvailable);
        state[name].push(clone);
        return { insertedId: clone._id || clone.ticketId };
      },
      async updateOne(filter, update) {
        const doc = state[name].find((d) => matches(d, filter));
        if (!doc) return { matchedCount: 0, modifiedCount: 0 };
        applyUpdate(doc, update);
        return { matchedCount: 1, modifiedCount: 1 };
      },
      async findOneAndUpdate(filter, update) {
        const doc = state[name].find((d) => matches(d, filter));
        if (!doc) return null;
        applyUpdate(doc, update);
        return structuredClone(doc);
      },
      async findOneAndDelete(filter) {
        const idx = state[name].findIndex((d) => matches(d, filter));
        if (idx === -1) return null;
        const [removed] = state[name].splice(idx, 1);
        return structuredClone(removed);
      },
      aggregate() {
        return {
          async toArray() {
            return [];
          }
        };
      }
    };
  }

  return {
    state,
    command: async () => ({ ok: 1 }),
    collection: (name) => makeCollection(name)
  };
}

test("API end-to-end flows with mocked campus_events DB", async () => {
  const mockDb = createMockDB();
  setDB(mockDb, { supportsTransactions: false });

  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();
    assert.equal(health.status, "ok");

    // 2. Task 2.1: Free events with > 50 seats
    const freeRes = await fetch(`${baseUrl}/api/events?free=true&minSeats=50`);
    const freeEvents = await freeRes.json();
    assert.equal(freeEvents.length, 1);
    assert.equal(freeEvents[0]._id, "EVT102");

    // 3. Task 3.1: Atomic booking decrements seats and blocks duplicate student booking
    const bookRes = await fetch(`${baseUrl}/api/registrations/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: "EVT101",
        studentId: "STU9012",
        studentName: "Kabir Mehta",
        department: "Computer Science",
        year: 2,
        paymentMethod: "UPI"
      })
    });
    assert.equal(bookRes.status, 201);
    const booked = await bookRes.json();
    assert.equal(booked.seatsRemaining, 44);
    assert.equal(booked.ticket.paymentDetails.amountPaid, 150);

    const dupRes = await fetch(`${baseUrl}/api/registrations/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: "EVT101",
        studentId: "STU9012",
        studentName: "Kabir Mehta",
        department: "Computer Science",
        year: 2
      })
    });
    assert.equal(dupRes.status, 409);
    // Verify compensating rollback restored seat back to 44
    assert.equal(mockDb.state.events.find((e) => e._id === "EVT101").seatsAvailable, 44);

    // 4. Task 3.2: Idempotent gate check-in
    const checkInRes = await fetch(`${baseUrl}/api/registrations/TICK-2026-001/check-in`, {
      method: "PATCH"
    });
    assert.equal(checkInRes.status, 200);

    const dupCheckInRes = await fetch(`${baseUrl}/api/registrations/TICK-2026-001/check-in`, {
      method: "PATCH"
    });
    assert.equal(dupCheckInRes.status, 409);

    // 5. Task 3.3: Idempotent sponsor addition
    const sponsorRes = await fetch(`${baseUrl}/api/events/EVT101/sponsors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sponsor: "CloudInc" })
    });
    assert.equal(sponsorRes.status, 200);
    const sponsorBody = await sponsorRes.json();
    assert.ok(sponsorBody.event.sponsors.includes("CloudInc"));

    // 6. Task 2.2 & 2.3: Tag matching and department registration lookup
    const taggedRes = await fetch(`${baseUrl}/api/events?tags=coding,hackathon`);
    assert.equal(taggedRes.status, 200);
    const taggedEvents = await taggedRes.json();
    assert.equal(taggedEvents.length, 1);
    assert.equal(taggedEvents[0]._id, "EVT101");

    const csRegsRes = await fetch(`${baseUrl}/api/registrations?department=Computer%20Science`);
    assert.equal(csRegsRes.status, 200);
    const csRegs = await csRegsRes.json();
    assert.ok(csRegs.length >= 3);

    // 7. Club membership addition + duplicate guard
    const memberRes = await fetch(`${baseUrl}/api/clubs/CLUB-CODE/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: "STU9500",
        name: "Siddharth Joshi",
        department: "Computer Science",
        year: 2,
        role: "Member"
      })
    });
    assert.equal(memberRes.status, 201);

    const dupMemberRes = await fetch(`${baseUrl}/api/clubs/CLUB-CODE/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: "STU9500",
        name: "Siddharth Joshi",
        department: "Computer Science",
        year: 2
      })
    });
    assert.equal(dupMemberRes.status, 409);

    // 8. Cancel unchecked-in ticket restores seat count
    const cancelRes = await fetch(`${baseUrl}/api/registrations/${booked.ticket.ticketId}`, {
      method: "DELETE"
    });
    assert.equal(cancelRes.status, 200);
    assert.equal(mockDb.state.events.find((e) => e._id === "EVT101").seatsAvailable, 45);

    // 9. Frontend static serving from ../frontend
    const htmlRes = await fetch(`${baseUrl}/`);
    assert.equal(htmlRes.status, 200);
    const htmlText = await htmlRes.text();
    assert.ok(htmlText.includes("Smart Campus Event Engine"));

    // 10. Analytics endpoint responds cleanly
    const analyticsRes = await fetch(`${baseUrl}/api/analytics`);
    assert.equal(analyticsRes.status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

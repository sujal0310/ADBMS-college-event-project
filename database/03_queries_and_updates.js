// ============================================================================
// Task 2: Event Discovery & Search (Read)
// Task 3: Real-Time Ticket Processing (Update)
// Run: mongosh database/03_queries_and_updates.js
// ============================================================================

const campusDb = db.getSiblingDB("campus_events");

// ----------------------------------------------------------------------------
// TASK 2: EVENT DISCOVERY & SEARCH (READ)
// ----------------------------------------------------------------------------

print("\n--- 2.1 Free Events Filter (entryFee: 0 AND seatsAvailable > 50) ---");
printjson(
  campusDb.events
    .find({ entryFee: 0, seatsAvailable: { $gt: 50 } })
    .toArray()
);

print('\n--- 2.2 Tag Matching ("coding" OR "hackathon") ---');
printjson(
  campusDb.events
    .find({ tags: { $in: ["coding", "hackathon"] } })
    .toArray()
);

print('\n--- 2.3 Department Lookup ("Computer Science" registrations) ---');
printjson(
  campusDb.registrations
    .find({ department: "Computer Science" })
    .toArray()
);

// ----------------------------------------------------------------------------
// TASK 3: REAL-TIME TICKET PROCESSING (UPDATE)
// ----------------------------------------------------------------------------

print("\n--- 3.1 Atomic Seat Booking for EVT101 ---");
const seatRes = campusDb.events.updateOne(
  { _id: "EVT101", seatsAvailable: { $gt: 0 } },
  { $inc: { seatsAvailable: Int32(-1) } }
);
printjson(seatRes);

print("\n--- 3.2 Check-In Status for TICK-2026-001 ---");
const checkInRes = campusDb.registrations.updateOne(
  { ticketId: "TICK-2026-001", checkInStatus: false },
  { $set: { checkInStatus: true, checkedInAt: new Date() } }
);
printjson(checkInRes);

print('\n--- 3.3 Add Sponsor "CloudInc" to EVT101 (idempotent via $addToSet) ---');
const sponsorRes = campusDb.events.updateOne(
  { _id: "EVT101" },
  { $addToSet: { sponsors: "CloudInc" } }
);
printjson(sponsorRes);

const { Int32 } = require("mongodb");
const { ensureSchemaAndIndexes } = require("./schemaAndIndexes");

function buildSeedData() {
  return {
    clubs: [
      {
        _id: "CLUB-CODE",
        name: "Coding Club",
        category: "Technical",
        department: "Computer Science",
        facultyAdvisor: "Dr. Meera Nair",
        lead: { name: "Aarav Sharma", studentId: "STU7101", email: "aarav@college.edu" },
        members: [
          { studentId: "STU7101", name: "Aarav Sharma", department: "Computer Science", year: new Int32(4), role: "President" },
          { studentId: "STU8821", name: "Priya Verma", department: "Computer Science", year: new Int32(3), role: "Core" }
        ],
        annualBudget: 50000,
        active: true
      },
      {
        _id: "CLUB-MUSIC",
        name: "Music Society",
        category: "Cultural",
        department: "Fine Arts",
        facultyAdvisor: "Prof. Vikram Rao",
        lead: { name: "Riya Sen", studentId: "STU6204", email: "riya@college.edu" },
        members: [
          { studentId: "STU6204", name: "Riya Sen", department: "Fine Arts", year: new Int32(3), role: "President" },
          { studentId: "STU8821", name: "Priya Verma", department: "Computer Science", year: new Int32(3), role: "Member" }
        ],
        annualBudget: 35000,
        active: true
      },
      {
        _id: "CLUB-ROBO",
        name: "Robotics Club",
        category: "Technical",
        department: "Electrical Engineering",
        facultyAdvisor: "Dr. Suresh Iyer",
        lead: { name: "Karan Patel", studentId: "STU5309", email: "karan@college.edu" },
        members: [
          { studentId: "STU5309", name: "Karan Patel", department: "Electrical Engineering", year: new Int32(4), role: "President" },
          { studentId: "STU4412", name: "Rohan Gupta", department: "Electrical Engineering", year: new Int32(2), role: "Member" }
        ],
        annualBudget: 65000,
        active: true
      }
    ],

    events: [
      {
        _id: "EVT101",
        title: "HackCampus 2026",
        category: "Technical",
        clubId: "CLUB-CODE",
        organizerClub: "Coding Club",
        venue: "Auditorium A",
        date: new Date("2026-10-15T09:00:00Z"),
        capacity: new Int32(200),
        seatsAvailable: new Int32(45),
        entryFee: 150,
        tags: ["hackathon", "coding", "prizes"],
        coordinators: [{ name: "Aarav Sharma", contact: "aarav@college.edu" }],
        sponsors: ["TechCorp", "DevStudio"]
      },
      {
        _id: "EVT102",
        title: "Annual Music Night",
        category: "Cultural",
        clubId: "CLUB-MUSIC",
        organizerClub: "Music Society",
        venue: "Open Air Theatre",
        date: new Date("2026-10-20T18:00:00Z"),
        capacity: new Int32(500),
        seatsAvailable: new Int32(120),
        entryFee: 0,
        tags: ["music", "concert", "night"],
        coordinators: [{ name: "Riya Sen", contact: "riya@college.edu" }],
        sponsors: []
      },
      {
        _id: "EVT103",
        title: "AI & Robotics Workshop",
        category: "Technical",
        clubId: "CLUB-ROBO",
        organizerClub: "Robotics Club",
        venue: "Lab 3",
        date: new Date("2026-11-05T10:00:00Z"),
        capacity: new Int32(60),
        seatsAvailable: new Int32(10),
        entryFee: 50,
        tags: ["ai", "robotics", "workshop"],
        coordinators: [{ name: "Karan Patel", contact: "karan@college.edu" }],
        sponsors: ["RoboLabs"]
      }
    ],

    registrations: [
      {
        ticketId: "TICK-2026-001",
        eventId: "EVT101",
        studentId: "STU8821",
        studentName: "Priya Verma",
        department: "Computer Science",
        year: new Int32(3),
        registrationDate: new Date("2026-09-12T14:30:00Z"),
        checkInStatus: false,
        checkedInAt: null,
        paymentDetails: { method: "UPI", amountPaid: 150, status: "Completed" }
      },
      {
        ticketId: "TICK-2026-002",
        eventId: "EVT102",
        studentId: "STU8821",
        studentName: "Priya Verma",
        department: "Computer Science",
        year: new Int32(3),
        registrationDate: new Date("2026-09-13T10:00:00Z"),
        checkInStatus: true,
        checkedInAt: new Date("2026-10-20T17:45:00Z"),
        paymentDetails: { method: "Free", amountPaid: 0, status: "Completed" }
      },
      {
        ticketId: "TICK-2026-003",
        eventId: "EVT101",
        studentId: "STU4412",
        studentName: "Rohan Gupta",
        department: "Electrical Engineering",
        year: new Int32(2),
        registrationDate: new Date("2026-09-14T11:20:00Z"),
        checkInStatus: true,
        checkedInAt: new Date("2026-10-15T08:50:00Z"),
        paymentDetails: { method: "Card", amountPaid: 150, status: "Completed" }
      },
      {
        ticketId: "TICK-2026-004",
        eventId: "EVT103",
        studentId: "STU9903",
        studentName: "Ananya Roy",
        department: "Computer Science",
        year: new Int32(4),
        registrationDate: new Date("2026-09-15T16:45:00Z"),
        checkInStatus: false,
        checkedInAt: null,
        paymentDetails: { method: "UPI", amountPaid: 50, status: "Completed" }
      }
    ]
  };
}

/**
 * Resets and seeds `clubs`, `events`, and `registrations` collections.
 * If `ifEmptyOnly` is true, seeding only runs when `events` is empty.
 */
async function seedDatabase(db, { ifEmptyOnly = false } = {}) {
  await ensureSchemaAndIndexes(db);

  if (ifEmptyOnly) {
    const existingCount = await db.collection("events").countDocuments();
    if (existingCount > 0) {
      return { skipped: true, clubs: 0, events: 0, registrations: 0 };
    }
  }

  const { clubs, events, registrations } = buildSeedData();

  await Promise.all([
    db.collection("clubs").deleteMany({}),
    db.collection("events").deleteMany({}),
    db.collection("registrations").deleteMany({})
  ]);

  await db.collection("clubs").insertMany(clubs);
  await db.collection("events").insertMany(events);
  await db.collection("registrations").insertMany(registrations);

  return {
    skipped: false,
    clubs: clubs.length,
    events: events.length,
    registrations: registrations.length
  };
}

module.exports = {
  buildSeedData,
  seedDatabase
};

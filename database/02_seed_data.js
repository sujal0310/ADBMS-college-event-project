// ============================================================================
// Task 1: Data Setup (Create) — Seed `clubs`, `events`, and `registrations`
// Run: mongosh database/02_seed_data.js
// ============================================================================

const campusDb = db.getSiblingDB("campus_events");

// Clear existing records for repeatable seeding
campusDb.clubs.deleteMany({});
campusDb.events.deleteMany({});
campusDb.registrations.deleteMany({});

// 1. Seed Clubs (completing the Phase 1 three-collection design)
campusDb.clubs.insertMany([
  {
    _id: "CLUB-CODE",
    name: "Coding Club",
    category: "Technical",
    department: "Computer Science",
    facultyAdvisor: "Dr. Meera Nair",
    lead: { name: "Aarav Sharma", studentId: "STU7101", email: "aarav@college.edu" },
    members: [
      { studentId: "STU7101", name: "Aarav Sharma", department: "Computer Science", year: 4, role: "President" },
      { studentId: "STU8821", name: "Priya Verma", department: "Computer Science", year: 3, role: "Core" }
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
      { studentId: "STU6204", name: "Riya Sen", department: "Fine Arts", year: 3, role: "President" },
      { studentId: "STU8821", name: "Priya Verma", department: "Computer Science", year: 3, role: "Member" }
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
      { studentId: "STU5309", name: "Karan Patel", department: "Electrical Engineering", year: 4, role: "President" },
      { studentId: "STU4412", name: "Rohan Gupta", department: "Electrical Engineering", year: 2, role: "Member" }
    ],
    annualBudget: 65000,
    active: true
  }
]);

// 2. Seed Events (EVT101, EVT102, EVT103)
campusDb.events.insertMany([
  {
    _id: "EVT101",
    title: "HackCampus 2026",
    category: "Technical",
    clubId: "CLUB-CODE",
    organizerClub: "Coding Club",
    venue: "Auditorium A",
    date: ISODate("2026-10-15T09:00:00Z"),
    capacity: Int32(200),
    seatsAvailable: Int32(45),
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
    date: ISODate("2026-10-20T18:00:00Z"),
    capacity: Int32(500),
    seatsAvailable: Int32(120),
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
    date: ISODate("2026-11-05T10:00:00Z"),
    capacity: Int32(60),
    seatsAvailable: Int32(10),
    entryFee: 50,
    tags: ["ai", "robotics", "workshop"],
    coordinators: [{ name: "Karan Patel", contact: "karan@college.edu" }],
    sponsors: ["RoboLabs"]
  }
]);

// 3. Seed Registrations (TICK-2026-001 .. TICK-2026-004)
campusDb.registrations.insertMany([
  {
    ticketId: "TICK-2026-001",
    eventId: "EVT101",
    studentId: "STU8821",
    studentName: "Priya Verma",
    department: "Computer Science",
    year: Int32(3),
    registrationDate: ISODate("2026-09-12T14:30:00Z"),
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
    year: Int32(3),
    registrationDate: ISODate("2026-09-13T10:00:00Z"),
    checkInStatus: true,
    checkedInAt: ISODate("2026-10-20T17:45:00Z"),
    paymentDetails: { method: "Free", amountPaid: 0, status: "Completed" }
  },
  {
    ticketId: "TICK-2026-003",
    eventId: "EVT101",
    studentId: "STU4412",
    studentName: "Rohan Gupta",
    department: "Electrical Engineering",
    year: Int32(2),
    registrationDate: ISODate("2026-09-14T11:20:00Z"),
    checkInStatus: true,
    checkedInAt: ISODate("2026-10-15T08:50:00Z"),
    paymentDetails: { method: "Card", amountPaid: 150, status: "Completed" }
  },
  {
    ticketId: "TICK-2026-004",
    eventId: "EVT103",
    studentId: "STU9903",
    studentName: "Ananya Roy",
    department: "Computer Science",
    year: Int32(4),
    registrationDate: ISODate("2026-09-15T16:45:00Z"),
    checkInStatus: false,
    checkedInAt: null,
    paymentDetails: { method: "UPI", amountPaid: 50, status: "Completed" }
  }
]);

print("=== SEEDING COMPLETED (3 clubs, 3 events, 4 registrations) ===");

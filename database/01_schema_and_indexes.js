// ============================================================================
// Phase 1: Schema Validation & Index Setup for `campus_events`
// Run: mongosh database/01_schema_and_indexes.js
// ============================================================================

const campusDb = db.getSiblingDB("campus_events");

// Reset collections cleanly if re-initializing
["clubs", "events", "registrations"].forEach((name) => {
  if (campusDb.getCollectionNames().includes(name)) {
    campusDb.getCollection(name).drop();
  }
});

// 1. Clubs Collection (handles club metadata & memberships)
campusDb.createCollection("clubs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "name", "category", "department", "lead", "members"],
      properties: {
        _id: { bsonType: "string" },
        name: { bsonType: "string", minLength: 2 },
        category: { enum: ["Technical", "Cultural", "Sports", "Literary", "Social"] },
        department: { bsonType: "string" },
        facultyAdvisor: { bsonType: "string" },
        lead: {
          bsonType: "object",
          required: ["name", "studentId", "email"],
          properties: {
            name: { bsonType: "string" },
            studentId: { bsonType: "string" },
            email: { bsonType: "string" }
          }
        },
        members: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["studentId", "name", "department", "year", "role"],
            properties: {
              studentId: { bsonType: "string" },
              name: { bsonType: "string" },
              department: { bsonType: "string" },
              year: { bsonType: "int", minimum: 1, maximum: 5 },
              role: { enum: ["Member", "Core", "Coordinator", "President"] }
            }
          }
        },
        annualBudget: { bsonType: ["int", "double"], minimum: 0 },
        active: { bsonType: "bool" }
      }
    }
  }
});

// 2. Events Collection
campusDb.createCollection("events", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "_id",
        "title",
        "category",
        "organizerClub",
        "venue",
        "date",
        "capacity",
        "seatsAvailable",
        "entryFee",
        "tags",
        "coordinators",
        "sponsors"
      ],
      properties: {
        _id: { bsonType: "string" },
        title: { bsonType: "string", minLength: 3 },
        category: { enum: ["Technical", "Cultural", "Sports", "Workshop", "Seminar"] },
        clubId: { bsonType: "string" },
        organizerClub: { bsonType: "string" },
        venue: { bsonType: "string" },
        date: { bsonType: "date" },
        capacity: { bsonType: "int", minimum: 1 },
        seatsAvailable: { bsonType: "int", minimum: 0 },
        entryFee: { bsonType: ["int", "double"], minimum: 0 },
        tags: { bsonType: "array", items: { bsonType: "string" } },
        coordinators: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["name", "contact"],
            properties: {
              name: { bsonType: "string" },
              contact: { bsonType: "string" }
            }
          }
        },
        sponsors: { bsonType: "array", items: { bsonType: "string" } }
      }
    }
  }
});

// 3. Registrations Collection
campusDb.createCollection("registrations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "ticketId",
        "eventId",
        "studentId",
        "studentName",
        "department",
        "year",
        "registrationDate",
        "checkInStatus",
        "paymentDetails"
      ],
      properties: {
        ticketId: { bsonType: "string" },
        eventId: { bsonType: "string" },
        studentId: { bsonType: "string" },
        studentName: { bsonType: "string" },
        department: { bsonType: "string" },
        year: { bsonType: "int", minimum: 1, maximum: 5 },
        registrationDate: { bsonType: "date" },
        checkInStatus: { bsonType: "bool" },
        checkedInAt: { bsonType: ["date", "null"] },
        paymentDetails: {
          bsonType: "object",
          required: ["method", "amountPaid", "status"],
          properties: {
            method: { enum: ["UPI", "Card", "Cash", "Free", "NetBanking"] },
            amountPaid: { bsonType: ["int", "double"], minimum: 0 },
            status: { enum: ["Pending", "Completed", "Refunded", "Failed"] }
          }
        }
      }
    }
  }
});

// Indexes for high-frequency discovery, ticket uniqueness, and analytics
campusDb.clubs.createIndex({ name: 1 }, { unique: true });
campusDb.clubs.createIndex({ "members.studentId": 1 });

campusDb.events.createIndex({ entryFee: 1, seatsAvailable: 1 });
campusDb.events.createIndex({ tags: 1 });
campusDb.events.createIndex({ organizerClub: 1, date: 1 });

campusDb.registrations.createIndex({ ticketId: 1 }, { unique: true });
campusDb.registrations.createIndex({ eventId: 1, studentId: 1 }, { unique: true });
campusDb.registrations.createIndex({ department: 1 });
campusDb.registrations.createIndex({ eventId: 1, checkInStatus: 1 });

print("=== Schema validation & indexes created for campus_events ===");

/**
 * MongoDB $jsonSchema validators and indexes for the `campus_events` database.
 * Mirrors `database/01_schema_and_indexes.js` for programmatic backend initialization.
 */

const COLLECTION_SCHEMAS = {
  clubs: {
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
  },

  events: {
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
  },

  registrations: {
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
};

/**
 * Ensures collections exist with $jsonSchema validators and creates all indexes.
 */
async function ensureSchemaAndIndexes(db) {
  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));

  for (const [name, validator] of Object.entries(COLLECTION_SCHEMAS)) {
    if (!existing.has(name)) {
      await db.createCollection(name, { validator });
    } else {
      await db.command({ collMod: name, validator }).catch(() => {
        // Ignore collMod permission errors on managed/restricted MongoDB tiers
      });
    }
  }

  await Promise.all([
    db.collection("clubs").createIndex({ name: 1 }, { unique: true }),
    db.collection("clubs").createIndex({ "members.studentId": 1 }),

    db.collection("events").createIndex({ entryFee: 1, seatsAvailable: 1 }),
    db.collection("events").createIndex({ tags: 1 }),
    db.collection("events").createIndex({ organizerClub: 1, date: 1 }),
    db.collection("events").createIndex({ clubId: 1, date: 1 }),

    db.collection("registrations").createIndex({ ticketId: 1 }, { unique: true }),
    db.collection("registrations").createIndex({ eventId: 1, studentId: 1 }, { unique: true }),
    db.collection("registrations").createIndex({ department: 1 }),
    db.collection("registrations").createIndex({ eventId: 1, checkInStatus: 1 })
  ]);
}

module.exports = {
  COLLECTION_SCHEMAS,
  ensureSchemaAndIndexes
};

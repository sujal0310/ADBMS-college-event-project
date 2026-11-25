# Smart Campus Event Engine & Ticket Hub — Backend

Modular Node.js + Express + MongoDB backend implementing the **campus_events** database specification (`clubs`, `events`, `registrations`), atomic seat booking, gate check-in, and aggregation analytics pipelines.

## Directory Structure

```text
backend/
├── .env.example
├── package.json
└── src/
    ├── app.js                      # Express app, CORS, static frontend/, routes, error handling
    ├── server.js                   # DB bootstrap, schema/index setup, HTTP server & shutdown
    ├── config/
    │   ├── env.js                  # Environment & .env loader
    │   └── db.js                   # MongoClient lifecycle & transaction capability detection
    ├── db/
    │   ├── schemaAndIndexes.js     # $jsonSchema validators & indexes for all 3 collections
    │   └── seedData.js             # Canonical dataset + idempotent seedDatabase()
    ├── middleware/
    │   ├── errorHandler.js         # AppError, asyncHandler, 404 & MongoDB error mapping
    │   ├── requestLogger.js        # API request timing logger
    │   └── validate.js             # Input validation helpers
    ├── services/
    │   ├── clubService.js          # Club CRUD & atomic membership updates
    │   ├── eventService.js         # Event discovery, creation, updates, $addToSet sponsors
    │   ├── registrationService.js  # Atomic ticket booking (tx + rollback), check-in, cancel
    │   └── analyticsService.js     # Task 4 MongoDB aggregation pipelines
    ├── controllers/                # HTTP request/response mapping
    ├── routes/                     # Modular Express routers mounted under /api
    ├── scripts/
    │   └── seed.js                 # CLI seeder (`npm run seed`)
    └── tests/
        └── api.test.js             # API flow tests using node:test
```

## Setup & Running

1. Copy `.env.example` to `.env` (optional, defaults match local MongoDB):
   ```bash
   cp .env.example .env
   ```
2. Install dependencies & seed MongoDB:
   ```bash
   cd backend
   npm install
   npm run seed
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Run tests:
   ```bash
   npm test
   ```

## REST API Endpoints

### System
- `GET /api/health` — Database ping & transaction support status
- `POST /api/seed` — Programmatically initializes schema/indexes and seeds dataset (supports `{ "ifEmptyOnly": true }`)

### Events (Tasks 1, 2.1, 2.2, 3.3)
- `GET /api/events` — Supports `?free=true`, `?minSeats=50`, `?tags=coding,hackathon`, `?category=...`, `?club=...`, `?clubId=...`, `?search=...`
- `GET /api/events/:eventId` — Event detail + live registration stats
- `POST /api/events` — Create a new event
- `PATCH /api/events/:eventId` — Update mutable event metadata
- `POST /api/events/:eventId/sponsors` — Idempotently add sponsor via `$addToSet`

### Registrations & Ticketing (Tasks 2.3, 3.1, 3.2)
- `GET /api/registrations` — Filter by `?department=...`, `?eventId=...`, `?ticketId=...`, `?studentId=...`, `?checkInStatus=true|false`
- `GET /api/registrations/:ticketId` — Single ticket lookup
- `POST /api/registrations/book` — Atomic seat decrement (`seatsAvailable > 0`) + ticket creation (uses ACID transaction on replica sets or compensating rollback on standalone MongoDB)
- `PATCH /api/registrations/:ticketId/check-in` — Idempotent venue gate check-in
- `DELETE /api/registrations/:ticketId` — Cancel unchecked-in ticket & restore 1 seat

### Clubs & Memberships
- `GET /api/clubs` — List clubs (`?category=...`, `?department=...`, `?studentId=...`)
- `GET /api/clubs/:clubId` — Club details & organized events
- `POST /api/clubs` — Create club
- `POST /api/clubs/:clubId/members` — Add member (duplicate `studentId` prevented)
- `DELETE /api/clubs/:clubId/members/:studentId` — Remove member

### Analytics (Task 4)
- `GET /api/analytics` — Combined dashboard payload (`revenueByEvent`, `departmentParticipation`, `turnoutRates`, `clubOverview`)
- `GET /api/analytics/revenue` — Revenue per event & organizing club
- `GET /api/analytics/departments` — Registrations & check-ins per department
- `GET /api/analytics/turnout` — Event turnout percentages
- `GET /api/analytics/clubs` — Club membership counts

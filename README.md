# Smart Campus Event Engine & Ticket Hub

A centralized college event platform and MongoDB database engine designed to manage **club memberships**, **fest & workshop registrations**, **atomic real-time ticket booking**, **venue check-in attendance**, and **analytics pipelines** across academic departments.

---

## Project Structure

The project is organized into three main folders (**`frontend/`**, **`backend/`**, and **`database/`**) plus architecture docs:

```text
smart-campus-event-hub/
├── README.md
├── package.json
├── docs/
│   └── ARCHITECTURE_AND_SCHEMA.md   # ER diagram, JSON Schema validators, indexing & concurrency design
├── frontend/
│   ├── README.md                    # Frontend usage guide (Live API & Standalone Demo Mode)
│   ├── index.html                   # Interactive Event Hub, Check-In, Clubs & Analytics UI
│   ├── styles.css                   # Responsive dark-theme styling
│   └── app.js                       # Client logic (Live REST API + offline demo fallback)
├── backend/
│   ├── package.json                 # Backend package manifest & scripts
│   ├── .env.example                 # Environment variables template
│   ├── README.md                    # Backend API & architecture reference
│   └── src/
│       ├── app.js                   # Express app setup, CORS, static frontend/, routes
│       ├── server.js                # Entrypoint (DB connect, schema setup, graceful shutdown)
│       ├── config/                  # Env loader & MongoDB connection / transaction detection
│       ├── db/                      # $jsonSchema validators, indexes & seedData
│       ├── middleware/              # Validation, request logger & centralized error handler
│       ├── services/                # Business logic (clubs, events, registrations, analytics)
│       ├── controllers/             # HTTP controllers
│       ├── routes/                  # Modular /api/* routers
│       ├── scripts/seed.js          # CLI database seeder
│       └── tests/api.test.js        # API flow tests (`node:test`)
└── database/
    ├── README.md                    # Database setup & mongosh guide
    ├── 01_schema_and_indexes.js     # Collection creation with $jsonSchema validation & indexes
    ├── 02_seed_data.js              # Seed clubs, events (EVT101-103), and registrations (TICK-2026-001..004)
    ├── 03_queries_and_updates.js    # Task 2 (Discovery/Read) & Task 3 (Atomic booking, check-in, sponsors)
    ├── 04_analytics_pipelines.js    # Task 4 (Revenue per Club, Department Participation, Turnout Rate)
    └── onecompiler_all_in_one.js    # Single self-contained script for OneCompiler / mongosh
```

---

## Quick Start

### Option 1: Run MongoDB Scripts Directly (`mongosh`)

```bash
mongosh database/01_schema_and_indexes.js
mongosh database/02_seed_data.js
mongosh database/03_queries_and_updates.js
mongosh database/04_analytics_pipelines.js
```

### Option 2: Paste into OneCompiler (MongoDB)

Copy the contents of [`database/onecompiler_all_in_one.js`](database/onecompiler_all_in_one.js) into OneCompiler's MongoDB editor and run it to see seeding, atomic updates, discovery queries, and all three aggregation pipelines execute end-to-end.

### Option 3: Run the Full-Stack Web App (Node.js + MongoDB)

1. Ensure MongoDB is running locally (default: `mongodb://127.0.0.1:27017`).
2. Install dependencies and start the server:
   ```bash
   npm install
   npm run seed   # Optional: seeds via Node.js (or use POST /api/seed / Reset Seed Data button)
   npm start
   ```
3. Open `http://localhost:3000` in your browser.
   > **Note:** You can also open `frontend/index.html` directly without MongoDB—the UI includes an automatic in-memory fallback mode for instant previewing.

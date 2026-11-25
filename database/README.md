# Smart Campus Event Engine & Ticket Hub — Database (`campus_events`)

Standalone MongoDB (`mongosh` / OneCompiler) scripts implementing the **Smart Campus Event Engine & Ticket Hub** database specification.

## Files

- `01_schema_and_indexes.js` — Creates `clubs`, `events`, and `registrations` collections with `$jsonSchema` validation and unique/compound/multikey indexes.
- `02_seed_data.js` — Seeds 3 clubs (`CLUB-CODE`, `CLUB-MUSIC`, `CLUB-ROBO`), 3 events (`EVT101`–`EVT103`), and 4 registrations (`TICK-2026-001`–`TICK-2026-004`).
- `03_queries_and_updates.js` — Executes Task 2 (Discovery/Read queries) and Task 3 (Atomic seat decrement `$inc`, check-in `$set`, sponsor `$addToSet`).
- `04_analytics_pipelines.js` — Executes Task 4 Aggregation Framework pipelines (Revenue per Event & Club, Department Participation, Turnout Rate, and Club Membership Overview).
- `onecompiler_all_in_one.js` — Self-contained script for OneCompiler's MongoDB editor.

## Run with `mongosh`

```bash
mongosh database/01_schema_and_indexes.js
mongosh database/02_seed_data.js
mongosh database/03_queries_and_updates.js
mongosh database/04_analytics_pipelines.js
```

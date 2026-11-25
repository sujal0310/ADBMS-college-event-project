# Smart Campus Event Engine & Ticket Hub — Frontend

Interactive dashboard for event discovery, atomic ticket booking, gate check-in, club memberships, and MongoDB aggregation analytics.

## Files

- `index.html` — Dashboard layout, tabs, and modal forms.
- `styles.css` — Responsive dark-theme styling.
- `app.js` — Client logic supporting both **Live MongoDB API** (when served by `backend/`) and **Standalone Demo Mode** (when opened directly in a browser).

## Running

- **With Backend + MongoDB:** Start the server from the project root (`npm start`) or backend (`npm start --prefix backend`), then open `http://localhost:3000`.
- **Standalone Demo Mode:** Open `frontend/index.html` directly in any browser; it automatically falls back to an in-memory dataset if `/api/health` is unreachable.

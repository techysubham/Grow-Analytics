# Analytics Backend

Lightweight Express + Mongoose backend for the Analytics app.

Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB Atlas connection string.
2. Install dependencies:

```bash
cd backend
npm install
```

3. Run server:

```bash
# development (auto-restart)
npm run dev

# or
npm start
```

API

- `POST /api/entries` — body: `{ account, date, items: [{name, qty}, ...] }` (creates/updates)
- `GET /api/entries?account=...&date=YYYY-MM-DD` — fetch a single sheet entry
- `GET /api/entries/aggregate` — returns aggregated data per date and category

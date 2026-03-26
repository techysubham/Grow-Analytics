# Analytics App (MERN)

This workspace contains a scaffold for an Analytics app using React (Vite) frontend and Node + Express + Mongoose backend with MongoDB Atlas.

Quick start

1. Backend:

```bash
cd backend
cp .env.example .env
# edit .env and set MONGODB_URI to your Atlas connection string
npm install
npm run dev
```

2. Frontend (in a separate terminal):

```bash
cd frontend
npm install
npm run dev
```

Open the frontend at `http://localhost:5173` and the backend runs at `http://localhost:4000` by default.

Endpoints

- `POST /api/entries` — upsert entry for account+date (body: `{ account, date, items }`)
- `GET /api/entries?account=...&date=...` — get sheet
- `GET /api/entries/aggregate` — aggregate data for dashboard

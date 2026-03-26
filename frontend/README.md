# Analytics Frontend

This is a simple Vite + React frontend for the Analytics app.

Setup

```bash
cd frontend
npm install
npm run dev
```

Notes

- Frontend expects the backend running at `http://localhost:4000`.
- Use the UI to load and save per-account per-date sheets. The dashboard calls `/api/entries/aggregate`.

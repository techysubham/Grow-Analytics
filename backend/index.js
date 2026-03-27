const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const entriesRouter = require('./routes/entries');
const accountsRouter = require('./routes/accounts');
const categoriesRouter = require('./routes/categories');

const app = express();

// Configure CORS for both local and production
app.use(cors({
  origin: [
    'http://localhost:3000',           // Local frontend dev
    'http://localhost:5173',           // Vite dev server
    'https://grow-analytics.vercel.app', // Vercel production
    /.+\.vercel\.app$/                 // Any Vercel preview deployment
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Warning: MONGODB_URI is not set. Set it in environment or .env');
}

mongoose.connect(MONGODB_URI || '', { })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err.message));

app.use('/api/entries', entriesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/categories', categoriesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
app.use(cors());
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

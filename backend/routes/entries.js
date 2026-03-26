const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');

// Create or update an entry for account+date
router.post('/', async (req, res) => {
  try {
    const { account, date, items } = req.body;
    if (!account || !date) return res.status(400).json({ error: 'account and date are required' });

    const doc = await Entry.findOneAndUpdate(
      { account, date },
      { $set: { items } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get entry for account+date
router.get('/', async (req, res) => {
  try {
    const { account, date } = req.query;
    if (!account || !date) return res.status(400).json({ error: 'account and date are required' });
    const doc = await Entry.findOne({ account, date });
    res.json(doc || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aggregate entries by date and category. Accept optional filters: account, startDate, endDate
router.get('/aggregate', async (req, res) => {
  try {
    const { account, startDate, endDate } = req.query;
    const q = {};
    if (account) q.account = account;
    if (startDate || endDate) q.date = {};
    if (startDate) q.date.$gte = startDate;
    if (endDate) q.date.$lte = endDate;

    const entries = await Entry.find(q);
    const data = {}; // data[date][category] = qty
    entries.forEach(e => {
      const d = e.date;
      if (!data[d]) data[d] = {};
      (e.items || []).forEach(it => {
        if (!it || !it.name) return;
        data[d][it.name] = (data[d][it.name] || 0) + (Number(it.qty) || 0);
      });
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return distinct dates for an account (useful for date pickers / ranges)
router.get('/dates', async (req, res) => {
  try {
    const { account } = req.query;
    const q = {};
    if (account) q.account = account;
    const dates = await Entry.distinct('date', q);
    dates.sort();
    res.json(dates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of distinct accounts
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await Entry.distinct('account');
    res.json(accounts.sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

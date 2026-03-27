const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');

// Create or update an entry for account+date+marketplace
router.post('/', async (req, res) => {
  try {
    const { account, marketplace, date, items } = req.body;
    if (!account || !date || !marketplace) return res.status(400).json({ error: 'account, marketplace and date are required' });

    const doc = await Entry.findOneAndUpdate(
      { account, marketplace, date },
      { $set: { account, marketplace, date, items } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get entry for account+date+marketplace
router.get('/', async (req, res) => {
  try {
    const { account, marketplace, date } = req.query;
    if (!account || !date || !marketplace) return res.status(400).json({ error: 'account, marketplace and date are required' });
    const doc = await Entry.findOne({ account, marketplace, date });
    res.json(doc || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aggregate entries by date and category. Accept optional filters: account, marketplace, startDate, endDate
router.get('/aggregate', async (req, res) => {
  try {
    const { account, marketplace, startDate, endDate } = req.query;
    const q = {};
    if (account) q.account = account;
    if (marketplace) q.marketplace = marketplace;
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

// Return distinct dates for an account+marketplace (useful for date pickers / ranges)
router.get('/dates', async (req, res) => {
  try {
    const { account, marketplace } = req.query;
    const q = {};
    if (account) q.account = account;
    if (marketplace) q.marketplace = marketplace;
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

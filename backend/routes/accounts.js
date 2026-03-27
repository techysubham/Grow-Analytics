const express = require('express');
const router = express.Router();
const Account = require('../models/Account');

// Rebuild indexes (migration endpoint)
router.post('/migrate/rebuild-indexes', async (req, res) => {
  try {
    // Drop all existing indexes (except _id)
    const collection = Account.collection;
    await collection.dropIndexes().catch(() => {}); // ignore if no indexes
    
    // Rebuilding indexes from schema definition
    await Account.collection.createIndex({ name: 1, marketplace: 1 }, { unique: true });
    
    res.json({ success: true, message: 'Indexes rebuilt successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// list accounts (optionally filter by marketplace)
router.get('/', async (req, res) => {
  try {
    const { marketplace } = req.query;
    const filter = { name: { $ne: null, $ne: '' } };
    if (marketplace) filter.marketplace = marketplace;
    const accounts = await Account.find(filter).sort('name');
    res.json(accounts.map(a => ({ name: a.name, marketplace: a.marketplace })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get available marketplaces
router.get('/marketplaces/list', async (req, res) => {
  try {
    res.json(['US', 'AUS', 'Canada', 'UK']);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create account
router.post('/', async (req, res) => {
  try {
    const { name, marketplace } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    if (!marketplace) return res.status(400).json({ error: 'marketplace required' });
    if (!['US', 'AUS', 'Canada', 'UK'].includes(marketplace)) {
      return res.status(400).json({ error: 'invalid marketplace' });
    }
    
    // create new account if not exists
    const existing = await Account.findOne({ name, marketplace });
    if (existing) return res.json({ name: existing.name, marketplace: existing.marketplace });
    
    const acc = await Account.create({ name, marketplace });
    res.json({ name: acc.name, marketplace: acc.marketplace });
  } catch (err) {
    if (err && err.code === 11000) {
      // duplicate key error - could be old index or actual duplicate
      const existing = await Account.findOne({ name: req.body.name, marketplace: req.body.marketplace });
      if (existing) return res.json({ name: existing.name, marketplace: existing.marketplace });
      
      // If we get here, it's likely an old index issue
      return res.status(409).json({ error: 'duplicate name detected - this may be due to an old index. Contact admin to run index migration.' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

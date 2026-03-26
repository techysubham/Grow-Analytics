const express = require('express');
const router = express.Router();
const Account = require('../models/Account');

// list accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ name: { $ne: null, $ne: '' } }, 'name').sort('name');
    res.json(accounts.map(a=>a.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create account
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    // create new account if not exists
    const existing = await Account.findOne({ name });
    if (existing) return res.json({ name: existing.name });
    const acc = await Account.create({ name });
    res.json({ name: acc.name });
  } catch (err) {
    if (err && err.code === 11000) {
      // duplicate key: try to return the existing document if possible
      try {
        const existing = await Account.findOne({ name });
        if (existing) return res.json({ name: existing.name });
      } catch (e) {
        // fall through
      }
      return res.status(409).json({ error: 'duplicate' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

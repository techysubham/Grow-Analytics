const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// list categories
router.get('/', async (req, res) => {
  try {
    const cats = await Category.find({}, 'name').sort('name');
    res.json(cats.map(c=>c.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const cat = await Category.findOneAndUpdate({ name }, { $setOnInsert: { name } }, { upsert: true, new: true });
    res.json({ name: cat.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

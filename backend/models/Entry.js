const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, default: 0 }
});

const EntrySchema = new mongoose.Schema({
  account: { type: String, required: true },
  date: { type: String, required: true }, // store as YYYY-MM-DD string
  items: [ItemSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Entry', EntrySchema);

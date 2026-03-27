const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, default: 0 }
});

const EntrySchema = new mongoose.Schema({
  account: { type: String, required: true },
  marketplace: { type: String, enum: ['US', 'AUS', 'Canada', 'UK'], required: true },
  date: { type: String, required: true }, // store as YYYY-MM-DD string
  items: [ItemSchema],
  createdAt: { type: Date, default: Date.now }
});

// Create unique index on account + marketplace + date combination
EntrySchema.index({ account: 1, marketplace: 1, date: 1 }, { unique: true });
// Create index for filtering by account + marketplace
EntrySchema.index({ account: 1, marketplace: 1 });
// Create index for filtering by marketplace
EntrySchema.index({ marketplace: 1 });

module.exports = mongoose.model('Entry', EntrySchema);

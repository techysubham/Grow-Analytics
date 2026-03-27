const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  marketplace: { type: String, enum: ['US', 'AUS', 'Canada', 'UK'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create unique index on name + marketplace combination
AccountSchema.index({ name: 1, marketplace: 1 }, { unique: true });

module.exports = mongoose.model('Account', AccountSchema);

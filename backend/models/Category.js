const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [1, 'Category name cannot be empty']
  },
  account: { 
    type: String, 
    required: [true, 'Account is required'],
    trim: true,
    minlength: [1, 'Account cannot be empty']
  },
  marketplace: { 
    type: String, 
    enum: ['US', 'AUS', 'Canada', 'UK'], 
    required: [true, 'Marketplace is required']
  },
  createdAt: { type: Date, default: Date.now }
});

// Create unique index on name + account + marketplace combination
CategorySchema.index({ name: 1, account: 1, marketplace: 1 }, { unique: true, sparse: false });
// Additional indexes for faster querying
CategorySchema.index({ account: 1, marketplace: 1 });
CategorySchema.index({ account: 1 });

// Pre-validate to ensure no empty strings slip through
CategorySchema.pre('save', function(next) {
  if (!this.account || !String(this.account).trim()) {
    throw new Error('Account cannot be empty or whitespace only');
  }
  if (!this.name || !String(this.name).trim()) {
    throw new Error('Name cannot be empty or whitespace only');
  }
  next();
});

module.exports = mongoose.model('Category', CategorySchema);

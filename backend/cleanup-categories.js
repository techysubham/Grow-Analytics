const mongoose = require('mongoose');
const Category = require('./models/Category');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grow-analytics';

(async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    // Delete all categories that don't have account or marketplace
    const result = await Category.deleteMany({
      $or: [
        { account: { $exists: false } },
        { account: null },
        { account: '' },
        { marketplace: { $exists: false } },
        { marketplace: null },
        { marketplace: '' }
      ]
    });
    
    console.log(`Deleted ${result.deletedCount} invalid category records`);
    
    // Show remaining categories
    const remaining = await Category.find({});
    console.log(`Remaining categories: ${remaining.length}`);
    remaining.forEach(cat => {
      console.log(`  - ${cat.name} (account: ${cat.account}, marketplace: ${cat.marketplace})`);
    });
    
    await mongoose.connection.close();
    console.log('Cleanup completed');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

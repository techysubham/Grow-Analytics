const mongoose = require('mongoose');
const Category = require('./models/Category');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/grow-analytics';

async function cleanup() {
  try {
    console.log('Connecting to MongoDB at', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✓ Connected to MongoDB\n');

    // Show all categories before cleanup
    const allBefore = await Category.find({});
    console.log(`Found ${allBefore.length} total categories before cleanup:`);
    allBefore.forEach(cat => {
      const account = cat.account || 'MISSING';
      const marketplace = cat.marketplace || 'MISSING';
      console.log(`  - ${cat.name} (${account}/${marketplace})`);
    });

    // Remove categories without account or marketplace fields
    console.log('\nRemoving invalid categories...');
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

    console.log(`✓ Deleted ${result.deletedCount} invalid categories\n`);
    
    // Show remaining categories
    const remaining = await Category.find({}).sort({ account: 1, marketplace: 1, name: 1 });
    console.log(`Remaining ${remaining.length} valid categories:`);
    remaining.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.account}/${cat.marketplace})`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Done!');
  } catch (err) {
    console.error('\n✗ Error:', err.message);
    process.exit(1);
  }
}

cleanup();

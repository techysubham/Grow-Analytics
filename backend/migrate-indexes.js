require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Set custom DNS servers (same as in index.js)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI || '', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('✓ MongoDB connected');

    // Migrate Account indexes
    const Account = require('./models/Account');
    const accountCollection = Account.collection;

    console.log('\n--- Migrating Account Collection ---');
    console.log('Dropping old Account indexes...');
    try {
      await accountCollection.dropIndexes();
      console.log('✓ Old Account indexes dropped');
    } catch (e) {
      console.log('ℹ No old Account indexes to drop');
    }

    console.log('Creating new compound index on (name, marketplace)...');
    await accountCollection.createIndex({ name: 1, marketplace: 1 }, { unique: true });
    console.log('✓ Account index created successfully');

    // Migrate Category indexes
    const Category = require('./models/Category');
    const categoryCollection = Category.collection;

    console.log('\n--- Migrating Category Collection ---');
    console.log('Dropping old Category indexes...');
    try {
      await categoryCollection.dropIndexes();
      console.log('✓ Old Category indexes dropped');
    } catch (e) {
      console.log('ℹ No old Category indexes to drop');
    }

    console.log('Creating new compound index on (name, account, marketplace)...');
    await categoryCollection.createIndex({ name: 1, account: 1, marketplace: 1 }, { unique: true });
    console.log('✓ Category index created successfully');

    console.log('\n--- Cleaning up old invalid categories ---');
    const oldCategoriesRemoved = await categoryCollection.deleteMany({ 
      $or: [
        { account: { $exists: false } },
        { marketplace: { $exists: false } }
      ]
    });
    console.log(`✓ Removed ${oldCategoriesRemoved.deletedCount} old invalid categories`);

    console.log('\n✓ Index migration completed!');
    console.log('Categories are now account and marketplace-specific.');
    
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  }
}

migrateIndexes();

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

    const Account = require('./models/Account');
    const collection = Account.collection;

    console.log('Dropping old indexes...');
    try {
      await collection.dropIndexes();
      console.log('✓ Old indexes dropped');
    } catch (e) {
      console.log('ℹ No old indexes to drop');
    }

    console.log('Creating new compound index on (name, marketplace)...');
    await collection.createIndex({ name: 1, marketplace: 1 }, { unique: true });
    console.log('✓ New index created successfully');

    console.log('\n✓ Index migration completed!');
    console.log('You can now create accounts with the same name across different marketplaces.');
    
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  }
}

migrateIndexes();

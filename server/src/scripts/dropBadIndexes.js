// Run this ONE TIME to fix the duplicate index error:
// cd server
// node src/scripts/dropBadIndexes.js
// node src/scripts/createAdmin.js
// Then delete this file - it is not needed again.

require('dotenv').config();
const mongoose = require('mongoose');

const dropIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    const collection = db.collection('users');
    const indexes = await collection.indexes();

    console.log('Current indexes:', indexes.map(i => i.name));

    const indexesToDrop = ['phoneNumber_1', 'phone_1'];

    for (const indexName of indexesToDrop) {
      const exists = indexes.find(i => i.name === indexName);
      if (exists) {
        await collection.dropIndex(indexName);
        console.log(`Dropped index: ${indexName}`);
      } else {
        console.log(`Index not found (skipping): ${indexName}`);
      }
    }

    console.log('Done. Run createAdmin.js now.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

dropIndexes();

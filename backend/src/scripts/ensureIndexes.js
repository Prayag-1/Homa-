require('dotenv').config();
const mongoose = require('mongoose');

const indexDefinitions = [
  {
    collection: 'products',
    indexes: [
      { keys: { isActive: 1, createdAt: -1 }, options: {} },
      { keys: { isActive: 1, isBestSeller: 1 }, options: {} },
      { keys: { isActive: 1, isNewArrival: 1 }, options: {} },
      { keys: { isActive: 1, category: 1 }, options: {} },
      { keys: { isActive: 1, brand: 1 }, options: {} },
      {
        keys: { name: 'text', brand: 'text', description: 'text' },
        options: {
          name: 'product_text_search',
          weights: { name: 10, brand: 5, description: 1 },
        },
        text: true,
      },
    ],
  },
  {
    collection: 'orders',
    indexes: [
      { keys: { user: 1, createdAt: -1 }, options: {} },
      { keys: { orderStatus: 1, createdAt: -1 }, options: {} },
      { keys: { paymentStatus: 1 }, options: {} },
    ],
  },
  {
    collection: 'users',
    indexes: [
      { keys: { email: 1 }, options: { unique: true, sparse: true } },
      { keys: { role: 1 }, options: {} },
    ],
  },
  {
    collection: 'brands',
    indexes: [
      { keys: { isActive: 1, sortOrder: 1 }, options: {} },
    ],
  },
  {
    collection: 'categories',
    indexes: [
      { keys: { isActive: 1, sortOrder: 1 }, options: {} },
    ],
  },
];

const sameKey = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function ensureTextIndex(collection, definition) {
  const indexes = await collection.indexes();
  const existingTextIndexes = indexes.filter((index) =>
    Object.values(index.key).includes('text'));

  for (const index of existingTextIndexes) {
    if (sameKey(index.key, definition.keys) && index.name === definition.options.name) {
      process.stdout.write(`${collection.collectionName}: ${index.name} already exists\n`);
      return;
    }

    process.stdout.write(`${collection.collectionName}: dropping incompatible text index ${index.name}\n`);
    await collection.dropIndex(index.name);
  }

  await collection.createIndex(definition.keys, definition.options);
  process.stdout.write(`${collection.collectionName}: created ${definition.options.name}\n`);
}

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

  for (const collectionConfig of indexDefinitions) {
    const collection = mongoose.connection.db.collection(collectionConfig.collection);

    for (const definition of collectionConfig.indexes) {
      if (definition.text) {
        await ensureTextIndex(collection, definition);
        continue;
      }

      const name = await collection.createIndex(definition.keys, definition.options);
      process.stdout.write(`${collectionConfig.collection}: ensured ${name}\n`);
    }
  }

  await mongoose.connection.close();
}

run().catch(async (error) => {
  process.stderr.write(`Failed to ensure indexes: ${error.message}\n`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});

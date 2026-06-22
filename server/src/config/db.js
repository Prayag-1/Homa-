const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is required');
    }

    const parsedUri = new URL(mongoUri);
    const isLocalMongo = ['localhost', '127.0.0.1', '::1'].includes(parsedUri.hostname);

    if (isLocalMongo && process.env.ALLOW_LOCAL_MONGO !== 'true') {
      throw new Error('Local MongoDB is disabled. Set MONGO_URI to your MongoDB Atlas connection string.');
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });

    const source = mongoUri.startsWith('mongodb+srv://') ? 'cloud' : 'direct';
    process.stdout.write(
      `MongoDB connected (${source}): ${conn.connection.host}/${conn.connection.name}\n`,
    );
  } catch (err) {
    process.stderr.write(`MongoDB connection failed: ${err.message}\n`);
    process.exit(1);
  }
};

module.exports = connectDB;

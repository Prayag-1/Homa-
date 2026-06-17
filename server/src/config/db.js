const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    process.stdout.write(`MongoDB connected: ${conn.connection.host}\n`);
  } catch (err) {
    process.stderr.write(`MongoDB connection failed: ${err.message}\n`);
    process.exit(1);
  }
};

module.exports = connectDB;

require('dotenv').config();
const User = require('../models/User');
const connectDB = require('../config/db');

const createAdmin = async () => {
  await connectDB();

  const existing = await User.findOne({ email: 'admin@homabeauty.com' });

  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await User.create({
    name: 'HOMA Admin',
    email: 'admin@homabeauty.com',
    password: 'Admin@Homa2025!',
    birthday: new Date('1990-01-01'),
    address: {
      line1: 'HOMA Beauty',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      country: 'Nepal',
    },
    role: 'admin',
    isVerified: true,
    verificationMethod: 'email',
  });

  console.log('Admin created:', admin.email);
  console.log('Password: Admin@Homa2025!');
  console.log('CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN');
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});

require('dotenv').config();
const User = require('../models/User');
const connectDB = require('../config/db');

const createAdmin = async () => {
  await connectDB();

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    process.stderr.write('INITIAL_ADMIN_EMAIL or ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required\n');
    process.exit(1);
  }

  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    existing.name = existing.name || 'HOMA Admin';
    existing.password = adminPassword;
    existing.role = 'admin';
    existing.isActive = true;
    existing.isVerified = true;
    existing.verificationMethod = existing.verificationMethod || 'email';
    existing.verification = undefined;
    await existing.save();

    process.stdout.write(`Admin updated: ${existing.email}\n`);
    process.stdout.write('Password reset from INITIAL_ADMIN_PASSWORD. Change it after login.\n');
    process.exit(0);
  }

  const admin = await User.create({
    name: 'HOMA Admin',
    email: adminEmail,
    password: adminPassword,
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

  process.stdout.write(`Admin created: ${admin.email}\n`);
  process.stdout.write('CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN\n');
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});

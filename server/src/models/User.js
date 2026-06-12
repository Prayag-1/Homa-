const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const { normalizePhoneNumber, normalizeEmail } = require('../utils/verification');
const { getMembershipTier } = require('../utils/loyalty');

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, sparse: true },
    phoneNumber: { type: String, sparse: true },
    password: { type: String, required: true, minlength: 8, select: false },
    birthday: { type: Date, required: true },
    address: { type: addressSchema, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    loyaltyPoints: { type: Number, default: 0 },
    membershipTier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      default: 'Bronze',
    },
    skinType: String,
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationMethod: { type: String, enum: ['email', 'phone'] },
    verification: {
      target: { type: String, select: false },
      codeHash: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      attempts: { type: Number, default: 0, select: false },
      lastSentAt: { type: Date, select: false },
    },
  },
  { timestamps: true },
);

userSchema.pre('validate', function (next) {
  if (this.email) {
    const normalizedEmail = normalizeEmail(this.email);
    this.email = normalizedEmail || this.email;
  }
  if (this.phone) {
    const normalized = normalizePhoneNumber(this.phone);
    this.phone = normalized || this.phone;
  }
  if (this.phoneNumber) {
    const normalized = normalizePhoneNumber(this.phoneNumber);
    this.phoneNumber = normalized || this.phoneNumber;
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcryptjs.hash(this.password, 12);
  }
  this.membershipTier = getMembershipTier(this.loyaltyPoints);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcryptjs.compare(candidate, this.password);
};

// Performance index — added for query optimization
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ membershipTier: 1 });

module.exports = mongoose.model('User', userSchema);

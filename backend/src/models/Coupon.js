const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, uppercase: true, required: true },
    discountType: { type: String, enum: ['flat', 'percentage'], required: true },
    discountValue: Number,
    minOrderAmount: { type: Number, default: 0 },
    maxUses: Number,
    usedCount: { type: Number, default: 0 },
    expiryDate: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);

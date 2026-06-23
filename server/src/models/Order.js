const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    vatAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    vatRate: { type: Number, default: 0.13 },
    shippingAddress: {
      street: String,
      city: String,
      phone: String,
    },
    paymentMethod: { type: String, enum: ['esewa', 'fonepay', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'pending_collection', 'collected'], default: 'pending' },
    orderStatus: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'], default: 'pending' },
    paymentRef: String,
    paidAt: Date,
    invoiceNumber: { type: String, unique: true, sparse: true },
    invoiceUrl: String,
    notes: String,
    couponCode: String,
    loyaltyPointsAwarded: { type: Boolean, default: false },
    loyaltyPointsAwardedPoints: { type: Number, default: 0 },
    loyaltyPointsAwardedAt: { type: Date },
  },
  { timestamps: true }
);

// Performance index — added for query optimization
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

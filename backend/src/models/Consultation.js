const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    phone: String,
    category: { type: String, enum: ['Acne Treatment', 'Sensitive Skin', 'Anti-Aging', 'Hydration'] },
    message: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consultation', consultationSchema);

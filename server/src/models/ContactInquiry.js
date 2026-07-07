const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: String, required: true, trim: true, maxlength: 220 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ['new', 'open', 'resolved'],
      default: 'new',
    },
    source: { type: String, trim: true, default: 'contact-form', maxlength: 50 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);

const mongoose = require('mongoose');
const { encryptText } = require('../utils/fieldEncryption');

const smtpSettingsSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 100 },
    host: { type: String, required: true, trim: true, maxlength: 255 },
    port: { type: Number, required: true, min: 1, max: 65535 },
    encryption: {
      type: String,
      enum: ['none', 'ssl', 'tls'],
      default: 'none',
    },
    username: { type: String, required: true, trim: true, maxlength: 200 },
    password: { type: String, required: true, select: false },
    from_email: { type: String, required: true, trim: true, maxlength: 255 },
    from_name: { type: String, required: true, trim: true, maxlength: 120 },
    is_active: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'smtp_settings',
  },
);

smtpSettingsSchema.pre('save', function encryptPassword(next) {
  if (this.isModified('password') && this.password && !String(this.password).startsWith('enc.')) {
    this.password = encryptText(this.password);
  }
  next();
});

smtpSettingsSchema.index({ is_active: 1, updatedAt: -1 });

module.exports = mongoose.model('SmtpSettings', smtpSettingsSchema);

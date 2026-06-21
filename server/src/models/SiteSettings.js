const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    // WhatsApp
    whatsapp: {
      phoneNumber: { type: String, default: '' },
      prefilledMessage: {
        type: String,
        default: 'Hi, I need help with HOMA Beauty',
        maxlength: 200,
      },
      isEnabled: { type: Boolean, default: false },
    },

    // Announcement Bar
    announcementBar: {
      text: { type: String, default: '', maxlength: 200 },
      bgColor: { type: String, default: '#C8432B', maxlength: 7 },
      textColor: { type: String, default: '#FFFFFF', maxlength: 7 },
      isActive: { type: Boolean, default: false },
      link: { type: String, default: '', maxlength: 500 },
      image: {
        url: { type: String, default: '' },
        publicId: { type: String, default: '' },
      },
      lastUpdatedAt: { type: Date, default: Date.now },
    },

    // Footer
    footer: {
      tagline: {
        type: String,
        default: 'Authentic Japanese Skincare for Nepal',
        maxlength: 200,
      },
      shopLinks: [
        {
          label: { type: String, maxlength: 50 },
          url: { type: String, maxlength: 500 },
          sortOrder: { type: Number, default: 0 },
          isActive: { type: Boolean, default: true },
        },
      ],
      companyLinks: [
        {
          label: { type: String, maxlength: 50 },
          url: { type: String, maxlength: 500 },
          sortOrder: { type: Number, default: 0 },
          isActive: { type: Boolean, default: true },
        },
      ],
      contact: {
        address: { type: String, maxlength: 300, default: 'Kathmandu, Nepal' },
        phone: { type: String, maxlength: 20 },
        email: { type: String, maxlength: 100 },
        mapUrl: { type: String, maxlength: 500 },
      },
      social: {
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        tiktok: { type: String, default: '' },
        youtube: { type: String, default: '' },
      },
      copyright: {
        type: String,
        default: '© 2025 HOMA Beauty. All rights reserved.',
        maxlength: 200,
      },
      showPaymentIcons: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

// Singleton pattern — only ever one document
siteSettingsSchema.statics.getInstance = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);

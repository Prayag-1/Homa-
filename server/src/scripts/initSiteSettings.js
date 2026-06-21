const mongoose = require('mongoose');
require('dotenv').config();
const SiteSettings = require('../models/SiteSettings');

const dbUri = process.env.MONGO_URI;

if (!dbUri) {
  throw new Error('MONGO_URI is required');
}

const initSiteSettings = async () => {
  try {
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existingSettings = await SiteSettings.findOne();
    if (existingSettings) {
      process.exit(0);
    }

    const defaultSettings = new SiteSettings({
      whatsapp: {
        phoneNumber: process.env.DEFAULT_WHATSAPP_PHONE || '',
        prefilledMessage: 'Hi, I need help with HOMA Beauty',
        isEnabled: false,
      },
      announcementBar: {
        text: 'Welcome to HOMA Beauty - Authentic Japanese Skincare',
        bgColor: '#C8432B',
        textColor: '#FFFFFF',
        isActive: false,
        link: '/shop',
        image: {
          url: '',
          publicId: '',
        },
        lastUpdatedAt: new Date(),
      },
      footer: {
        tagline: 'Authentic Japanese Skincare for Nepal',
        shopLinks: [
          { label: 'All Products', url: '/shop', sortOrder: 0, isActive: true },
          { label: 'New Arrivals', url: '/shop?sort=new', sortOrder: 1, isActive: true },
          { label: 'Best Sellers', url: '/shop?sort=best', sortOrder: 2, isActive: true },
          { label: 'Skin Quiz', url: '/quiz', sortOrder: 3, isActive: true },
        ],
        companyLinks: [
          { label: 'About Us', url: '/about', sortOrder: 0, isActive: true },
          { label: 'Blog', url: '/blog', sortOrder: 1, isActive: true },
          { label: 'FAQ', url: '/faq', sortOrder: 2, isActive: true },
          { label: 'Distributors', url: '/distributors', sortOrder: 3, isActive: true },
          { label: 'Contact', url: '/contact', sortOrder: 4, isActive: true },
        ],
        contact: {
          address: process.env.DEFAULT_CONTACT_ADDRESS || '',
          phone: process.env.DEFAULT_CONTACT_PHONE || '',
          email: process.env.DEFAULT_CONTACT_EMAIL || '',
          mapUrl: process.env.DEFAULT_CONTACT_MAP_URL || '',
        },
        social: {
          facebook: process.env.DEFAULT_SOCIAL_FACEBOOK || '',
          instagram: process.env.DEFAULT_SOCIAL_INSTAGRAM || '',
          tiktok: process.env.DEFAULT_SOCIAL_TIKTOK || '',
          youtube: process.env.DEFAULT_SOCIAL_YOUTUBE || '',
        },
        copyright: 'Copyright 2025 HOMA Beauty. All rights reserved.',
        showPaymentIcons: true,
      },
    });

    await defaultSettings.save();
    process.exit(0);
  } catch (err) {
    console.error('Error initializing SiteSettings:', err.message);
    process.exit(1);
  }
};

initSiteSettings();

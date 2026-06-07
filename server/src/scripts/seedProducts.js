require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/homa';
const writeLine = (message = '') => process.stdout.write(`${message}\n`);

const products = [
  {
    name: 'Hada Labo Lotion Plus',
    slug: 'hada-labo-lotion-plus',
    sku: 'HL-LP-001',
    brand: 'Hada Labo',
    category: 'Toner',
    description: 'Lightweight hydrating toner with hyaluronic acid. Penetrates deep into skin for optimal hydration.',
    ingredients: ['Hyaluronic Acid', 'Water', 'Glycerin'],
    benefits: ['Hydration', 'Anti-aging', 'Brightening'],
    price: 2500,
    comparePrice: 3000,
    stock: 50,
    images: [{ url: 'https://picsum.photos/seed/hada-labo-lotion-plus/600/600', publicId: 'hada-labo-lotion-plus' }],
    skinTypes: ['Oily', 'Combination'],
    certifications: ['Dermatologist-tested'],
    isNewArrival: true,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'SK-II Facial Treatment Essence',
    slug: 'sk-ii-facial-treatment-essence',
    sku: 'SKII-FTE-001',
    brand: 'SK-II',
    category: 'Essence',
    description: 'Premium essence with Pitera complex. Transforms skin texture and improves radiance.',
    ingredients: ['Pitera', 'Glycerin', 'Water'],
    benefits: ['Anti-aging', 'Brightening', 'Smoothing'],
    price: 8000,
    comparePrice: 9500,
    stock: 30,
    images: [{ url: 'https://picsum.photos/seed/sk-ii-facial-treatment/600/600', publicId: 'sk-ii-facial-treatment' }],
    skinTypes: ['Dry', 'Sensitive'],
    certifications: ['Hypoallergenic'],
    isNewArrival: false,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Shiseido Ultimate Sun Protection Lotion',
    slug: 'shiseido-ultimate-sun-protection',
    sku: 'SHSD-USP-001',
    brand: 'Shiseido',
    category: 'Sunscreen',
    description: 'Broad-spectrum SPF 50+ sunscreen. Lightweight formula provides excellent protection without white cast.',
    ingredients: ['Zinc Oxide', 'Titanium Dioxide', 'Antioxidants'],
    benefits: ['UV Protection', 'Anti-aging'],
    price: 3200,
    comparePrice: 4000,
    stock: 60,
    images: [{ url: 'https://picsum.photos/seed/shiseido-sunscreen/600/600', publicId: 'shiseido-sunscreen' }],
    skinTypes: ['Oily', 'Acne-Prone'],
    certifications: ['Water-resistant'],
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'COSRX Advanced Snail 96 Mucin Power Essence',
    slug: 'cosrx-advanced-snail-96',
    sku: 'COSRX-ASM-001',
    brand: 'COSRX',
    category: 'Essence',
    description: 'Highly concentrated snail secretion filtrate. Soothes and repairs damaged skin barrier.',
    ingredients: ['Snail Secretion Filtrate', 'Allantoin', 'Panthenol'],
    benefits: ['Healing', 'Hydration', 'Soothing'],
    price: 1800,
    comparePrice: 2200,
    stock: 80,
    images: [{ url: 'https://picsum.photos/seed/cosrx-snail-essence/600/600', publicId: 'cosrx-snail-essence' }],
    skinTypes: ['Sensitive', 'Combination'],
    certifications: ['Cruelty-free'],
    isNewArrival: true,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Biore UV Aqua Rich Watery Essence',
    slug: 'biore-uv-aqua-rich',
    sku: 'BIORE-AQE-001',
    brand: 'Biore',
    category: 'Sunscreen',
    description: 'Lightweight watery sunscreen. Easy to reapply, non-greasy, perfect for daily use.',
    ingredients: ['Glycerin', 'Water', 'Sunscreen agents'],
    benefits: ['UV Protection', 'Moisturizing'],
    price: 1200,
    comparePrice: 1500,
    stock: 100,
    images: [{ url: 'https://picsum.photos/seed/biore-uv-essence/600/600', publicId: 'biore-uv-essence' }],
    skinTypes: ['Oily', 'Combination', 'Acne-Prone'],
    certifications: ['Water-resistant'],
    isNewArrival: false,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'KOSE Softymo Speedy Cleansing Oil',
    slug: 'kose-softymo-speedy',
    sku: 'KOSE-SSC-001',
    brand: 'Kose',
    category: 'Cleanser',
    description: 'Fast-acting cleansing oil. Removes makeup and impurities without stripping skin.',
    ingredients: ['Plant oils', 'Emulsifiers'],
    benefits: ['Deep cleansing', 'Make-up removal'],
    price: 1600,
    comparePrice: 2000,
    stock: 70,
    images: [{ url: 'https://picsum.photos/seed/kose-cleansing-oil/600/600', publicId: 'kose-cleansing-oil' }],
    skinTypes: ['Oily', 'Combination'],
    certifications: ['Makeup-removing'],
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'Hada Labo Premium Anti-Aging Cream',
    slug: 'hada-labo-premium-cream',
    sku: 'HL-PAC-001',
    brand: 'Hada Labo',
    category: 'Moisturiser',
    description: 'Rich anti-aging cream with collagen and hyaluronic acid. Restores firmness and elasticity.',
    ingredients: ['Hyaluronic Acid', 'Collagen', 'Shea Butter'],
    benefits: ['Anti-aging', 'Firming', 'Moisturising'],
    price: 3800,
    comparePrice: 4500,
    stock: 40,
    images: [{ url: 'https://picsum.photos/seed/hada-labo-cream/600/600', publicId: 'hada-labo-cream' }],
    skinTypes: ['Dry', 'Sensitive'],
    certifications: ['Hypoallergenic'],
    isNewArrival: true,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'SK-II R.N.A Moisturizing Serum',
    slug: 'sk-ii-rna-serum',
    sku: 'SKII-RNS-001',
    brand: 'SK-II',
    category: 'Serum',
    description: 'Advanced serum with RNA complex. Boosts skin elasticity and targets fine lines.',
    ingredients: ['R.N.A', 'Pitera', 'Glycerin'],
    benefits: ['Anti-aging', 'Elasticity', 'Firming'],
    price: 5200,
    comparePrice: 6000,
    stock: 25,
    images: [{ url: 'https://picsum.photos/seed/sk-ii-rna-serum/600/600', publicId: 'sk-ii-rna-serum' }],
    skinTypes: ['Dry', 'Combination'],
    certifications: ['Hypoallergenic'],
    isNewArrival: true,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Shiseido Benefiance Night Cream',
    slug: 'shiseido-benefiance-night',
    sku: 'SHSD-BNC-001',
    brand: 'Shiseido',
    category: 'Moisturiser',
    description: 'Regenerating night cream. Maximizes skin recovery during sleep with advanced nutrients.',
    ingredients: ['Retinol', 'Hyaluronic Acid', 'Plant extracts'],
    benefits: ['Anti-aging', 'Regenerating', 'Nourishing'],
    price: 4500,
    comparePrice: 5500,
    stock: 35,
    images: [{ url: 'https://picsum.photos/seed/shiseido-night-cream/600/600', publicId: 'shiseido-night-cream' }],
    skinTypes: ['Dry', 'Sensitive'],
    certifications: ['Dermatologist-tested'],
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'COSRX Hydrium Watery Toner Plus',
    slug: 'cosrx-hydrium-toner',
    sku: 'COSRX-HWT-001',
    brand: 'COSRX',
    category: 'Toner',
    description: 'Hydrating toner with hyaluronic acid and minerals. Prep skin for better absorption.',
    ingredients: ['Hyaluronic Acid', 'Allantoin', 'Panthenol'],
    benefits: ['Hydration', 'Priming', 'Soothing'],
    price: 1600,
    comparePrice: 2000,
    stock: 90,
    images: [{ url: 'https://picsum.photos/seed/cosrx-toner/600/600', publicId: 'cosrx-toner' }],
    skinTypes: ['Oily', 'Combination'],
    certifications: ['Cruelty-free'],
    isNewArrival: false,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Biore Cleansing Micellar Water',
    slug: 'biore-micellar-water',
    sku: 'BIORE-CMW-001',
    brand: 'Biore',
    category: 'Cleanser',
    description: 'Gentle micellar water. Removes makeup and dirt without harsh rubbing.',
    ingredients: ['Micellar molecules', 'Water', 'Gentle surfactants'],
    benefits: ['Gentle cleansing', 'Makeup removal'],
    price: 900,
    comparePrice: 1200,
    stock: 110,
    images: [{ url: 'https://picsum.photos/seed/biore-micellar/600/600', publicId: 'biore-micellar' }],
    skinTypes: ['Sensitive', 'All types'],
    certifications: ['Soap-free'],
    isNewArrival: true,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'KOSE Medicated Active Vitamin C Whitening Mask',
    slug: 'kose-vitamin-c-mask',
    sku: 'KOSE-VCM-001',
    brand: 'Kose',
    category: 'Mask',
    description: 'Brightening sheet mask with Vitamin C. Instant radiance and hydration boost.',
    ingredients: ['Vitamin C', 'Glycerin', 'Honey extract'],
    benefits: ['Brightening', 'Whitening', 'Hydrating'],
    price: 2200,
    comparePrice: 2800,
    stock: 55,
    images: [{ url: 'https://picsum.photos/seed/kose-mask/600/600', publicId: 'kose-mask' }],
    skinTypes: ['Dull', 'Combination'],
    certifications: ['Alcohol-free'],
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    writeLine('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    writeLine('Cleared existing products');

    // Seed products
    const createdProducts = await Product.insertMany(products);
    writeLine('');
    writeLine(`Successfully seeded ${createdProducts.length} products:`);
    writeLine('');

    createdProducts.forEach((product) => {
      writeLine(`  - ${product.name} (${product.brand}) - NPR ${product.price}`);
    });

    writeLine('');
    writeLine('Seed script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();


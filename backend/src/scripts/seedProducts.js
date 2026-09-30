require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { generateSlug } = require('../utils/slugify');

const dbUri = process.env.MONGO_URI;

if (!dbUri) {
  throw new Error('MONGO_URI is required');
}

const categoryMeta = {
  Cleanser: {
    label: 'Gel Cleanser',
    code: 'CL',
    basePrice: 1400,
    imageTone: '#F5E6D3',
    focus: 'daily cleanse',
  },
  Toner: {
    label: 'Balancing Toner',
    code: 'TN',
    basePrice: 1300,
    imageTone: '#E6F0F0',
    focus: 'balance and prep',
  },
  Serum: {
    label: 'Treatment Serum',
    code: 'SR',
    basePrice: 2200,
    imageTone: '#ECE5F7',
    focus: 'targeted treatment',
  },
  Moisturiser: {
    label: 'Cream Moisturiser',
    code: 'MS',
    basePrice: 2400,
    imageTone: '#F3E9E2',
    focus: 'barrier support',
  },
  Sunscreen: {
    label: 'Daily Sunscreen',
    code: 'SS',
    basePrice: 1800,
    imageTone: '#F2F0D6',
    focus: 'broad spectrum protection',
  },
  Mask: {
    label: 'Face Mask',
    code: 'MK',
    basePrice: 1600,
    imageTone: '#E3F1E8',
    focus: 'weekly recovery',
  },
  Essence: {
    label: 'Hydrating Essence',
    code: 'ES',
    basePrice: 2100,
    imageTone: '#E7F3FA',
    focus: 'deep hydration',
  },
  'Eye Care': {
    label: 'Eye Cream',
    code: 'EY',
    basePrice: 2000,
    imageTone: '#EFE8F6',
    focus: 'under-eye care',
  },
};

const variantMeta = [
  {
    key: 'hydra',
    name: 'Hydra Balance',
    brand: 'AquaDerm',
    descriptor: 'light hydration for everyday use',
    ingredients: ['Hyaluronic Acid', 'Panthenol', 'Ceramides'],
    benefits: ['Hydrates', 'Supports the barrier', 'Leaves a fresh finish'],
    skinTypes: ['Dry', 'Combination', 'Sensitive'],
    ratings: { average: 4.7, count: 182 },
    isBestSeller: true,
    isNewArrival: false,
    accent: '#5B86E5',
  },
  {
    key: 'calm',
    name: 'Calm Barrier',
    brand: 'CalmLeaf',
    descriptor: 'soothing care for reactive skin',
    ingredients: ['Centella Asiatica', 'Allantoin', 'Beta-Glucan'],
    benefits: ['Calms redness', 'Comforts stressed skin', 'Barrier support'],
    skinTypes: ['Sensitive', 'Dry', 'Combination'],
    ratings: { average: 4.8, count: 143 },
    isBestSeller: true,
    isNewArrival: false,
    accent: '#6BBF92',
  },
  {
    key: 'bright',
    name: 'Bright Boost',
    brand: 'GlowTheory',
    descriptor: 'radiance support and uneven tone care',
    ingredients: ['Vitamin C', 'Niacinamide', 'Licorice Root'],
    benefits: ['Brightens dull skin', 'Evens tone', 'Adds glow'],
    skinTypes: ['Oily', 'Combination', 'Acne-Prone'],
    ratings: { average: 4.6, count: 211 },
    isBestSeller: true,
    isNewArrival: true,
    accent: '#F4A261',
  },
  {
    key: 'clear',
    name: 'Clear Control',
    brand: 'PureBarrier',
    descriptor: 'refining care for breakout-prone skin',
    ingredients: ['Salicylic Acid', 'Zinc PCA', 'Tea Tree'],
    benefits: ['Helps unclog pores', 'Reduces excess oil', 'Targets breakouts'],
    skinTypes: ['Oily', 'Acne-Prone', 'Combination'],
    ratings: { average: 4.5, count: 196 },
    isBestSeller: false,
    isNewArrival: true,
    accent: '#E76F51',
  },
  {
    key: 'repair',
    name: 'Barrier Repair',
    brand: 'DermaBloom',
    descriptor: 'replenishing care for dry or damaged skin',
    ingredients: ['Ceramides', 'Squalane', 'Niacinamide'],
    benefits: ['Repairs the barrier', 'Locks in moisture', 'Softens texture'],
    skinTypes: ['Dry', 'Sensitive', 'Combination'],
    ratings: { average: 4.9, count: 158 },
    isBestSeller: true,
    isNewArrival: false,
    accent: '#B08968',
  },
  {
    key: 'firm',
    name: 'Firm Renewal',
    brand: 'VelvetSkin',
    descriptor: 'age-supporting care with a smoother finish',
    ingredients: ['Peptides', 'Bakuchiol', 'Vitamin E'],
    benefits: ['Supports firmness', 'Smooths fine lines', 'Improves bounce'],
    skinTypes: ['Dry', 'Combination', 'Sensitive'],
    ratings: { average: 4.4, count: 121 },
    isBestSeller: false,
    isNewArrival: true,
    accent: '#7D5BA6',
  },
];

const imageSvg = (title, subtitle, tone, accent) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" role="img" aria-label="${title}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${tone}" />
        <stop offset="100%" stop-color="#FFFFFF" />
      </linearGradient>
      <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#1A1410" stop-opacity="0.02" />
      </linearGradient>
    </defs>
    <rect width="600" height="800" rx="36" fill="url(#bg)" />
    <rect x="42" y="42" width="516" height="716" rx="30" fill="url(#card)" stroke="#1A1410" stroke-opacity="0.08" />
    <circle cx="300" cy="225" r="118" fill="${accent}" fill-opacity="0.14" />
    <circle cx="300" cy="225" r="72" fill="${accent}" fill-opacity="0.26" />
    <text x="300" y="212" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#1A1410">${title}</text>
    <text x="300" y="252" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#1A1410" opacity="0.72">${subtitle}</text>
    <rect x="146" y="412" width="308" height="94" rx="24" fill="#FFFFFF" fill-opacity="0.92" stroke="#1A1410" stroke-opacity="0.08" />
    <text x="300" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#1A1410">HOMA TEST PRODUCT</text>
    <text x="300" y="482" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#1A1410" opacity="0.7">Sample catalog entry for development</text>
  </svg>
`;

const toDataUrl = (title, subtitle, tone, accent) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(imageSvg(title, subtitle, tone, accent))}`;

const buildProducts = () => {
  const products = [];

  for (const [category, meta] of Object.entries(categoryMeta)) {
    for (const variant of variantMeta) {
      const name = `${variant.name} ${meta.label}`;
      const sku = `HOMA-${meta.code}-${variant.key.toUpperCase()}`;
      const price = meta.basePrice + variantMeta.indexOf(variant) * 120;
      const comparePrice = price + 250;

      products.push({
        name,
        slug: generateSlug(name),
        sku,
        brand: variant.brand,
        category,
        description: `${name} is a ${variant.descriptor} designed for ${meta.focus}.`,
        ingredients: variant.ingredients,
        howToUse: `Apply ${name.toLowerCase()} after cleansing. Use morning and night as needed.`,
        benefits: [
          ...variant.benefits,
          `Built for ${meta.focus}`,
          `Fits ${category.toLowerCase()} routines`,
        ],
        price,
        comparePrice,
        stock: 30 + variantMeta.indexOf(variant) * 4,
        images: [
          {
            url: toDataUrl(name, category, meta.imageTone, variant.accent),
            publicId: `seed-${sku.toLowerCase()}`,
          },
        ],
        skinTypes: variant.skinTypes,
        certifications: ['Dermatologist Tested', 'Cruelty Free'],
        isNewArrival: variant.isNewArrival,
        isBestSeller: variant.isBestSeller,
        isActive: true,
        seo: {
          metaTitle: `${name} | HOMA`,
          metaDescription: `${name} for ${variant.descriptor}.`,
          focusKeyword: name,
          keywords: [name, category, variant.brand, 'skincare'],
          canonicalUrl: `https://homa.local/products/${generateSlug(name)}`,
        },
        ratings: variant.ratings,
      });
    }
  }

  return products;
};

const seedProducts = async () => {
  try {
    await mongoose.connect(dbUri);

    const products = buildProducts();
    const operations = products.map((product) => ({
      updateOne: {
        filter: { sku: product.sku },
        update: { $set: product },
        upsert: true,
      },
    }));

    const result = await Product.bulkWrite(operations, { ordered: false });

    console.log(`Seeded products: ${result.upsertedCount || 0} inserted, ${result.modifiedCount || 0} updated.`);
    console.log(`Total sample products processed: ${products.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect failures during cleanup.
    }
    process.exit(1);
  }
};

seedProducts();

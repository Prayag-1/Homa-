require('dotenv').config();
const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const { generateSlug } = require('../utils/slugify');

const dbUri = process.env.MONGO_URI;

if (!dbUri) {
  throw new Error('MONGO_URI is required');
}

const brands = ['Hada Labo', 'SK-II', 'Shiseido', 'Cosrx', 'Biore', 'Kose'];
const categories = ['Moisturiser', 'Serum', 'Toner', 'Sunscreen', 'Cleanser', 'Eye Care', 'Mask', 'Essence'];

const seedCollection = async (Model, items, label) => {
  for (const [sortOrder, name] of items.entries()) {
    await Model.findOneAndUpdate(
      { name },
      {
        $set: {
          name,
          slug: generateSlug(name),
          sortOrder,
          isActive: true,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  }
};

const seedBrandsCategories = async () => {
  try {
    await mongoose.connect(dbUri);

    await seedCollection(Brand, brands, 'brand');
    await seedCollection(Category, categories, 'category');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding brands and categories:', error);
    process.exit(1);
  }
};

seedBrandsCategories();

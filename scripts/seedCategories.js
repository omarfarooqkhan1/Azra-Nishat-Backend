require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/Category');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/azra-nishat-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Sample Categories
const sampleCategories = [
  {
    name: 'Jewelry',
    slug: 'jewelry',
    description: 'Beautiful jewelry collection',
    isActive: true
  },
  {
    name: 'Cosmetics',
    slug: 'cosmetics',
    description: 'Premium beauty products',
    isActive: true
  },
  {
    name: 'Couture',
    slug: 'couture',
    description: 'Designer clothing and fashion',
    isActive: true
  },
  {
    name: 'Rings',
    slug: 'rings',
    description: 'Elegant rings for all occasions',
    parentCategory: null, // Will be populated after creation
    level: 2,
    isActive: true
  },
  {
    name: 'Earrings',
    slug: 'earrings',
    description: 'Stylish earrings collection',
    parentCategory: null, // Will be populated after creation
    level: 2,
    isActive: true
  },
  {
    name: 'Necklaces',
    slug: 'necklaces',
    description: 'Beautiful necklaces',
    parentCategory: null, // Will be populated after creation
    level: 2,
    isActive: true
  },
  {
    name: 'Bracelets',
    slug: 'bracelets',
    description: 'Stylish bracelets collection',
    parentCategory: null, // Will be populated after creation
    level: 2,
    isActive: true
  },
  {
    name: 'Skincare',
    slug: 'skincare',
    description: 'Premium skincare products',
    parentCategory: null, // Will be populated after creation
    level: 2,
    isActive: true
  },
  {
    name: 'Makeup',
    slug: 'makeup',
    description: 'Quality makeup products',
    parentCategory: null, // Will be populated after creation
    level: 2,
    isActive: true
  },
  {
    name: 'Perfumes',
    slug: 'perfumes',
    description: 'Luxury perfumes and fragrances',
    parentCategory: null, // Will be populated after creation
    level: 2,
    isActive: true
  },
  {
    name: 'Watches',
    slug: 'watches',
    description: 'Designer watches collection',
    parentCategory: null, // Will be populated after creation
    level: 2,
    isActive: true
  },
  {
    name: 'Sarees',
    slug: 'sarees',
    description: 'Traditional Pakistani sarees',
    parentCategory: null, // Will be populated after creation
    level: 2,
    isActive: true
  },
  {
    name: 'Shalwar Kameez',
    slug: 'shalwar-kameez',
    description: 'Traditional Pakistani outfits',
    parentCategory: null, // Will be populated after creation
    level: 2,
    isActive: true
  }
];

const seedCategories = async () => {
  try {
    await connectDB();
    
    // Clear existing categories
    console.log('Clearing existing categories...');
    await Category.deleteMany({});
    
    // Create categories
    console.log('Creating categories...');
    let createdCategories = await Category.insertMany(sampleCategories);
    
    // Update parent categories for subcategories
    const jewelryCategory = createdCategories.find(cat => cat.name === 'Jewelry');
    const cosmeticsCategory = createdCategories.find(cat => cat.name === 'Cosmetics');
    const coutureCategory = createdCategories.find(cat => cat.name === 'Couture');
    
    // Update subcategories with parent references
    const ringsCategory = createdCategories.find(cat => cat.name === 'Rings');
    const earringsCategory = createdCategories.find(cat => cat.name === 'Earrings');
    const necklacesCategory = createdCategories.find(cat => cat.name === 'Necklaces');
    const braceletsCategory = createdCategories.find(cat => cat.name === 'Bracelets');
    const skincareCategory = createdCategories.find(cat => cat.name === 'Skincare');
    const makeupCategory = createdCategories.find(cat => cat.name === 'Makeup');
    const perfumesCategory = createdCategories.find(cat => cat.name === 'Perfumes');
    const watchesCategory = createdCategories.find(cat => cat.name === 'Watches');
    const sareesCategory = createdCategories.find(cat => cat.name === 'Sarees');
    const shalwarKameezCategory = createdCategories.find(cat => cat.name === 'Shalwar Kameez');
    
    if (jewelryCategory) {
      await Category.findByIdAndUpdate(ringsCategory._id, { parentCategory: jewelryCategory._id, level: 2 });
      await Category.findByIdAndUpdate(earringsCategory._id, { parentCategory: jewelryCategory._id, level: 2 });
      await Category.findByIdAndUpdate(necklacesCategory._id, { parentCategory: jewelryCategory._id, level: 2 });
      await Category.findByIdAndUpdate(braceletsCategory._id, { parentCategory: jewelryCategory._id, level: 2 });
      await Category.findByIdAndUpdate(watchesCategory._id, { parentCategory: jewelryCategory._id, level: 2 });
    }
    
    if (cosmeticsCategory) {
      await Category.findByIdAndUpdate(skincareCategory._id, { parentCategory: cosmeticsCategory._id, level: 2 });
      await Category.findByIdAndUpdate(makeupCategory._id, { parentCategory: cosmeticsCategory._id, level: 2 });
      await Category.findByIdAndUpdate(perfumesCategory._id, { parentCategory: cosmeticsCategory._id, level: 2 });
    }
    
    if (coutureCategory) {
      await Category.findByIdAndUpdate(sareesCategory._id, { parentCategory: coutureCategory._id, level: 2 });
      await Category.findByIdAndUpdate(shalwarKameezCategory._id, { parentCategory: coutureCategory._id, level: 2 });
    }
    
    // Refresh the categories list after updates
    createdCategories = await Category.find({});
    
    console.log('Categories seeded successfully!');
    console.log(`${createdCategories.length} categories created`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
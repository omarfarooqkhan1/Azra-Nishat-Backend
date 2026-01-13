require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

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
  }
];

// Sample Users
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+1234567890',
    shippingAddress: {
      street: '123 Main St',
      city: 'Karachi',
      state: 'Sindh',
      zipCode: '75650',
      country: 'Pakistan'
    },
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+1234567891',
    shippingAddress: {
      street: '456 Oak St',
      city: 'Lahore',
      state: 'Punjab',
      zipCode: '54000',
      country: 'Pakistan'
    },
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1234567899',
    shippingAddress: {
      street: '789 Admin St',
      city: 'Islamabad',
      state: 'ICT',
      zipCode: '44000',
      country: 'Pakistan'
    },
    isActive: true,
    isVerified: true
  }
];

// Sample Products
const sampleProducts = [
  {
    name: 'Diamond Stud Earrings',
    slug: 'diamond-stud-earrings',
    description: 'Beautiful diamond stud earrings perfect for any occasion.',
    shortDescription: 'Classic diamond studs',
    brand: 'Azra Nishat Jewelry',
    tags: ['diamond', 'earrings', 'jewelry'],
    variants: [
      {
        sku: 'DSE-001-G',
        weight: 5,
        metalType: 'Gold',
        purity: '18K',
        color: 'Yellow',
        price: 85000,
        salePrice: 75000,
        stockQuantity: 15,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1600861965180-4d51e6f0eff8?w=800&auto=format&fit=crop&q=60',
            altText: 'Diamond Stud Earrings'
          }
        ]
      },
      {
        sku: 'DSE-001-WG',
        weight: 5,
        metalType: 'White Gold',
        purity: '18K',
        color: 'White',
        price: 85000,
        salePrice: 75000,
        stockQuantity: 10,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1599640842225-85d176518f7d?w=800&auto=format&fit=crop&q=60',
            altText: 'Diamond Stud Earrings White Gold'
          }
        ]
      }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600861965180-4d51e6f0eff8?w=800&auto=format&fit=crop&q=60',
        altText: 'Diamond Stud Earrings'
      }
    ],
    isFeatured: true,
    isNew: true,
    isOnSale: true,
    discountPercentage: 12,
    metaTitle: 'Diamond Stud Earrings - Azra Nishat',
    metaDescription: 'Beautiful diamond stud earrings perfect for any occasion',
    seoKeywords: ['diamond earrings', 'gold earrings', 'jewelry'],
    isActive: true,
    dimensions: {
      length: 0.5,
      width: 0.5,
      height: 0.5
    },
    weight: 5,
    material: 'Gold',
    careInstructions: 'Clean with soft cloth, avoid contact with chemicals'
  },
  {
    name: 'Gold Chain Necklace',
    slug: 'gold-chain-necklace',
    description: 'Elegant gold chain necklace that adds sophistication to any outfit.',
    shortDescription: 'Sophisticated gold chain',
    brand: 'Azra Nishat Jewelry',
    tags: ['gold', 'necklace', 'chain', 'jewelry'],
    variants: [
      {
        sku: 'GCN-001-YG-18K',
        weight: 12,
        metalType: 'Yellow Gold',
        purity: '18K',
        color: 'Yellow',
        size: '20 inches',
        price: 120000,
        salePrice: 110000,
        stockQuantity: 8,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1599640842225-85d176518f7d?w=800&auto=format&fit=crop&q=60',
            altText: 'Gold Chain Necklace'
          }
        ]
      }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1599640842225-85d176518f7d?w=800&auto=format&fit=crop&q=60',
        altText: 'Gold Chain Necklace'
      }
    ],
    isFeatured: true,
    isNew: false,
    isOnSale: true,
    discountPercentage: 8,
    metaTitle: 'Gold Chain Necklace - Azra Nishat',
    metaDescription: 'Elegant gold chain necklace that adds sophistication to any outfit',
    seoKeywords: ['gold necklace', 'chain necklace', 'jewelry'],
    isActive: true,
    dimensions: {
      length: 50,
      width: 2,
      height: 1
    },
    weight: 12,
    material: 'Gold',
    careInstructions: 'Store in dry place, clean with gold cleaner'
  },
  {
    name: 'Premium Foundation',
    slug: 'premium-foundation',
    description: 'High-quality foundation that provides full coverage with a natural finish.',
    shortDescription: 'Full coverage foundation',
    brand: 'Azra Nishat Cosmetics',
    tags: ['foundation', 'makeup', 'cosmetics'],
    variants: [
      {
        sku: 'PF-001-NC15',
        weight: 30,
        color: 'Multi-color',
        size: '30ml',
        price: 4500,
        stockQuantity: 25,
        purity: 'Standard',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=60',
            altText: 'Premium Foundation NC15'
          }
        ]
      },
      {
        sku: 'PF-001-NC20',
        weight: 30,
        color: 'Multi-color',
        size: '30ml',
        price: 4500,
        stockQuantity: 22,
        purity: 'Standard',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=60',
            altText: 'Premium Foundation NC20'
          }
        ]
      }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=60',
        altText: 'Premium Foundation'
      }
    ],
    isFeatured: false,
    isNew: true,
    isOnSale: false,
    metaTitle: 'Premium Foundation - Azra Nishat Cosmetics',
    metaDescription: 'High-quality foundation that provides full coverage with a natural finish',
    seoKeywords: ['foundation', 'makeup', 'cosmetics'],
    isActive: true,
    weight: 30,
    material: 'Liquid Makeup',
    careInstructions: 'Close cap tightly after use, store in cool place'
  },
  {
    name: 'Silk Evening Gown',
    slug: 'silk-evening-gown',
    description: 'Luxurious silk evening gown perfect for formal events.',
    shortDescription: 'Luxurious silk gown',
    brand: 'Azra Nishat Couture',
    tags: ['evening gown', 'silk', 'couture', 'formal'],
    variants: [
      {
        sku: 'SEG-001-SIZE6',
        weight: 500,
        size: 'Small',
        color: 'Multi-color',
        price: 85000,
        stockQuantity: 5,
        purity: 'Standard',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=60',
            altText: 'Silk Evening Gown Size S'
          }
        ]
      },
      {
        sku: 'SEG-001-SIZE8',
        weight: 500,
        size: 'Medium',
        color: 'Multi-color',
        price: 85000,
        stockQuantity: 7,
        purity: 'Standard',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=60',
            altText: 'Silk Evening Gown Size M'
          }
        ]
      }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=60',
        altText: 'Silk Evening Gown'
      }
    ],
    isFeatured: true,
    isNew: false,
    isOnSale: true,
    discountPercentage: 15,
    metaTitle: 'Silk Evening Gown - Azra Nishat Couture',
    metaDescription: 'Luxurious silk evening gown perfect for formal events',
    seoKeywords: ['evening gown', 'silk dress', 'couture'],
    isActive: true,
    dimensions: {
      length: 120,
      width: 60,
      height: 5
    },
    weight: 500,
    material: 'Silk',
    careInstructions: 'Dry clean only, store hanging on padded hanger'
  }
];

// Sample Orders
const sampleOrders = [
  {
    orderNumber: 'ORD-001',
    user: null, // Will be populated after user creation
    items: [
      {
        product: null, // Will be populated after product creation
        quantity: 1,
        price: 75000,
        subtotal: 75000
      }
    ],
    subtotal: 75000,
    taxAmount: 7500,
    shippingCost: 500,
    discountAmount: 7500,
    totalAmount: 75500,
    currency: 'PKR',
    shippingAddress: {
      street: '123 Main St',
      city: 'Karachi',
      state: 'Sindh',
      zipCode: '75650',
      country: 'Pakistan',
      phone: '+1234567890'
    },
    billingAddress: {
      street: '123 Main St',
      city: 'Karachi',
      state: 'Sindh',
      zipCode: '75650',
      country: 'Pakistan',
      phone: '+1234567890'
    },
    paymentMethod: 'credit_card',
    paymentStatus: 'completed',
    orderStatus: 'delivered',
    shippedDate: new Date(Date.now() - 86400000 * 5), // 5 days ago
    deliveredDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    notes: 'Handle with care'
  },
  {
    orderNumber: 'ORD-002',
    user: null, // Will be populated after user creation
    items: [
      {
        product: null, // Will be populated after product creation
        quantity: 2,
        price: 110000,
        subtotal: 220000
      }
    ],
    subtotal: 220000,
    taxAmount: 22000,
    shippingCost: 500,
    discountAmount: 11000,
    totalAmount: 231500,
    currency: 'PKR',
    shippingAddress: {
      street: '456 Oak St',
      city: 'Lahore',
      state: 'Punjab',
      zipCode: '54000',
      country: 'Pakistan',
      phone: '+1234567891'
    },
    billingAddress: {
      street: '456 Oak St',
      city: 'Lahore',
      state: 'Punjab',
      zipCode: '54000',
      country: 'Pakistan',
      phone: '+1234567891'
    },
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'completed',
    orderStatus: 'shipped',
    shippedDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    notes: 'Call before delivery'
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Clear Redis Cache
    console.log('Clearing Redis cache...');
    const redis = require('redis');
    const redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));

    await redisClient.connect();
    await redisClient.flushAll();
    await redisClient.quit();

    // Create categories
    console.log('Creating categories...');
    let createdCategories = await Category.insertMany(sampleCategories);

    // Update parent categories for subcategories
    const jewelryCategory = createdCategories.find(cat => cat.name === 'Jewelry');
    const cosmeticsCategory = createdCategories.find(cat => cat.name === 'Cosmetics');

    // Update subcategories with parent references
    const ringsCategory = createdCategories.find(cat => cat.name === 'Rings');
    const earringsCategory = createdCategories.find(cat => cat.name === 'Earrings');
    const necklacesCategory = createdCategories.find(cat => cat.name === 'Necklaces');
    const skincareCategory = createdCategories.find(cat => cat.name === 'Skincare');
    const makeupCategory = createdCategories.find(cat => cat.name === 'Makeup');

    if (jewelryCategory) {
      await Category.findByIdAndUpdate(ringsCategory._id, { parentCategory: jewelryCategory._id, level: 2 });
      await Category.findByIdAndUpdate(earringsCategory._id, { parentCategory: jewelryCategory._id, level: 2 });
      await Category.findByIdAndUpdate(necklacesCategory._id, { parentCategory: jewelryCategory._id, level: 2 });
    }

    if (cosmeticsCategory) {
      await Category.findByIdAndUpdate(skincareCategory._id, { parentCategory: cosmeticsCategory._id, level: 2 });
      await Category.findByIdAndUpdate(makeupCategory._id, { parentCategory: cosmeticsCategory._id, level: 2 });
    }

    // Refresh the categories list after updates
    createdCategories = await Category.find({});

    // Create users
    console.log('Creating users...');
    // Hash passwords for all users
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (userData) => {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        return {
          ...userData,
          password: hashedPassword
        };
      })
    );
    const createdUsers = await User.insertMany(usersWithHashedPasswords);

    // Create products with category references
    console.log('Creating products...');
    const updatedSampleProducts = sampleProducts.map(product => {
      let categoryId;

      // Assign the first category (Jewelry) to products that should have it
      if (product.name.includes('Earring') || product.name.includes('Chain')) {
        const category = createdCategories.find(cat => cat.name === 'Jewelry');
        categoryId = category._id;
      } else if (product.name.includes('Foundation')) {
        const category = createdCategories.find(cat => cat.name === 'Cosmetics');
        categoryId = category._id;
      } else if (product.name.includes('Gown')) {
        const category = createdCategories.find(cat => cat.name === 'Couture');
        categoryId = category._id;
      } else {
        // Default to first category if none match
        categoryId = createdCategories[0]._id;
      }

      // Calculate price from variants for the root product document
      // This is necessary because insertMany bypasses the pre-save hook where this logic usually lives
      let price = 0;
      let salePrice = undefined;
      let isOnSale = false;

      if (product.variants && product.variants.length > 0) {
        const prices = product.variants.map(v => v.price);
        const salePrices = product.variants.map(v => v.salePrice).filter(p => p != null && p > 0);

        price = Math.min(...prices);
        if (salePrices.length > 0) {
          salePrice = Math.min(...salePrices);
          isOnSale = true;
        }
      }

      return {
        ...product,
        category: categoryId,
        price,
        salePrice,
        isOnSale
      };
    });

    const createdProducts = await Product.insertMany(updatedSampleProducts);

    // Create orders with user and product references
    console.log('Creating orders...');
    const updatedSampleOrders = sampleOrders.map((order, index) => {
      const user = createdUsers[index % createdUsers.length];
      const product = createdProducts[index % createdProducts.length];

      return {
        ...order,
        user: user._id,
        items: order.items.map(item => ({
          ...item,
          product: product._id,
          price: product.variants[0].salePrice || product.variants[0].price,
          subtotal: (product.variants[0].salePrice || product.variants[0].price) * item.quantity
        })),
        subtotal: (product.variants[0].salePrice || product.variants[0].price) * order.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: ((product.variants[0].salePrice || product.variants[0].price) * order.items.reduce((sum, item) => sum + item.quantity, 0) * 1.1) + 500 - ((product.variants[0].salePrice || product.variants[0].price) * 0.1)
      };
    });

    await Order.insertMany(updatedSampleOrders);

    console.log('Database seeded successfully!');
    console.log(`${createdCategories.length} categories created`);
    console.log(`${createdUsers.length} users created`);
    console.log(`${createdProducts.length} products created`);
    console.log(`${sampleOrders.length} orders created`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
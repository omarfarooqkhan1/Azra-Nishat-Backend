require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
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
        color: 'NC15',
        size: '30ml',
        price: 4500,
        stockQuantity: 25,
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
        color: 'NC20',
        size: '30ml',
        price: 4500,
        stockQuantity: 22,
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
        color: 'Burgundy',
        price: 85000,
        stockQuantity: 5,
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
        color: 'Burgundy',
        price: 85000,
        stockQuantity: 7,
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
  },
  {
    name: 'Rose Gold Watch',
    slug: 'rose-gold-watch',
    description: 'Elegant rose gold watch with premium leather strap.',
    shortDescription: 'Premium rose gold watch',
    brand: 'Azra Nishat Accessories',
    tags: ['watch', 'rose gold', 'accessories'],
    variants: [
      {
        sku: 'RGW-001-RG',
        weight: 80,
        metalType: 'Rose Gold',
        purity: '14K',
        size: '42mm',
        price: 65000,
        salePrice: 58000,
        stockQuantity: 12,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60',
            altText: 'Rose Gold Watch'
          }
        ]
      }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60',
        altText: 'Rose Gold Watch'
      }
    ],
    isFeatured: true,
    isNew: true,
    isOnSale: true,
    discountPercentage: 11,
    metaTitle: 'Rose Gold Watch - Azra Nishat',
    metaDescription: 'Elegant rose gold watch with premium leather strap',
    seoKeywords: ['rose gold watch', 'leather strap', 'luxury watch'],
    isActive: true,
    dimensions: {
      length: 42,
      width: 42,
      height: 12
    },
    weight: 80,
    material: 'Rose Gold & Leather',
    careInstructions: 'Clean with soft cloth, avoid water contact'
  },
  {
    name: 'Moisturizing Face Cream',
    slug: 'moisturizing-face-cream',
    description: 'Hydrating face cream with natural ingredients for daily skincare routine.',
    shortDescription: 'Daily moisturizing cream',
    brand: 'Azra Nishat Skincare',
    tags: ['moisturizer', 'face cream', 'skincare'],
    variants: [
      {
        sku: 'MFC-001-50ML',
        weight: 50,
        size: '50ml',
        price: 3200,
        stockQuantity: 30,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=60',
            altText: 'Moisturizing Face Cream'
          }
        ]
      }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=60',
        altText: 'Moisturizing Face Cream'
      }
    ],
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    metaTitle: 'Moisturizing Face Cream - Azra Nishat Skincare',
    metaDescription: 'Hydrating face cream with natural ingredients for daily skincare routine',
    seoKeywords: ['face cream', 'moisturizer', 'skincare'],
    isActive: true,
    weight: 50,
    material: 'Cream',
    careInstructions: 'Apply morning and night, store in cool place'
  },
  {
    name: 'Traditional Pakistani Saree',
    slug: 'traditional-pakistani-saree',
    description: 'Beautiful traditional Pakistani saree with intricate embroidery.',
    shortDescription: 'Traditional embroidered saree',
    brand: 'Azra Nishat Couture',
    tags: ['saree', 'traditional', 'pakistani', 'couture'],
    variants: [
      {
        sku: 'TPS-001-RED',
        weight: 400,
        color: 'Red',
        size: 'Free Size',
        price: 45000,
        stockQuantity: 8,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1595675024853-0f3ec9098ac7?w=800&auto=format&fit=crop&q=60',
            altText: 'Traditional Pakistani Saree Red'
          }
        ]
      },
      {
        sku: 'TPS-001-BLUE',
        weight: 400,
        color: 'Blue',
        size: 'Free Size',
        price: 45000,
        stockQuantity: 6,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1595675024853-0f3ec9098ac7?w=800&auto=format&fit=crop&q=60',
            altText: 'Traditional Pakistani Saree Blue'
          }
        ]
      }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1595675024853-0f3ec9098ac7?w=800&auto=format&fit=crop&q=60',
        altText: 'Traditional Pakistani Saree'
      }
    ],
    isFeatured: true,
    isNew: false,
    isOnSale: true,
    discountPercentage: 10,
    metaTitle: 'Traditional Pakistani Saree - Azra Nishat Couture',
    metaDescription: 'Beautiful traditional Pakistani saree with intricate embroidery',
    seoKeywords: ['saree', 'traditional', 'pakistani', 'embroidery'],
    isActive: true,
    dimensions: {
      length: 550,
      width: 120,
      height: 2
    },
    weight: 400,
    material: 'Cotton & Silk Blend',
    careInstructions: 'Hand wash separately, dry in shade'
  }
];

const seedProducts = async () => {
  try {
    await connectDB();
    
    // Get existing categories
    const categories = await Category.find({});
    if (categories.length === 0) {
      console.log('No categories found. Please seed categories first.');
      process.exit(1);
    }
    
    // Clear existing products
    console.log('Clearing existing products...');
    await Product.deleteMany({});
    
    // Create products with category references
    console.log('Creating products...');
    const updatedSampleProducts = sampleProducts.map(product => {
      // Assign appropriate categories based on product name
      if (product.name.includes('Earring') || product.name.includes('Chain') || product.name.includes('Watch')) {
        const category = categories.find(cat => cat.name === 'Jewelry');
        return { ...product, category: category._id };
      } else if (product.name.includes('Foundation') || product.name.includes('Face Cream')) {
        const category = categories.find(cat => cat.name === 'Cosmetics');
        return { ...product, category: category._id };
      } else if (product.name.includes('Gown') || product.name.includes('Saree')) {
        const category = categories.find(cat => cat.name === 'Couture');
        return { ...product, category: category._id };
      } else {
        // Default to first category if none match
        return { ...product, category: categories[0]._id };
      }
    });
    
    const createdProducts = await Product.insertMany(updatedSampleProducts);
    
    console.log('Products seeded successfully!');
    console.log(`${createdProducts.length} products created`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
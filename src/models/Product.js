const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  weight: {
    type: Number, // in grams
    required: true
  },
  metalType: {
    type: String,
    enum: ['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Yellow Gold']
  },
  purity: {
    type: String, // e.g., 22K, 24K, 18K
    required: true
  },
  color: {
    type: String,
    enum: ['Yellow', 'White', 'Rose', 'Multi-color']
  },
  size: {
    type: String // e.g., ring size, chain length
  },
  gemstoneDetails: {
    stoneType: String,
    caratWeight: Number,
    clarity: String,
    cut: String,
    color: String
  },
  price: {
    type: Number,
    required: true
  },
  salePrice: {
    type: Number
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  images: [{
    url: String,
    altText: String
  }]
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  variants: [productVariantSchema],
  primaryVariant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant'
  },
  images: [{
    url: String,
    altText: String
  }],
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  metaTitle: {
    type: String,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  seoKeywords: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  weight: Number, // in grams
  price: {
    type: Number,
    required: true,
    default: 0
  },
  salePrice: {
    type: Number
  },
  material: String,
  careInstructions: String
}, {
  timestamps: true
});

const { generateSlug } = require('../utils/helpers');

// Pre-save hook to update root price from variants if not set or if variants change
productSchema.pre('save', function (next) {
  // Generate slug if not present or name modified
  if (!this.slug || this.isModified('name')) {
    this.slug = generateSlug(this.name);
  }

  if (this.variants && this.variants.length > 0) {
    // Set root price to the minimum price among variants
    const prices = this.variants.map(v => v.price);
    const salePrices = this.variants.map(v => v.salePrice).filter(p => p != null && p > 0);

    this.price = Math.min(...prices);
    if (salePrices.length > 0) {
      this.salePrice = Math.min(...salePrices);
      this.isOnSale = true;
    } else {
      this.salePrice = undefined;
      this.isOnSale = false;
    }
  }
  next();
});

// Virtual populate for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false
});

module.exports = mongoose.model('Product', productSchema);
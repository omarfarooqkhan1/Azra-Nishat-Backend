const { z } = require('zod');

// Product validation schema
const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(200, 'Product name must be at most 200 characters'),
  slug: z.string().min(3, 'Product slug must be at least 3 characters').optional(),
  description: z.string().min(10, 'Product description must be at least 10 characters'),
  shortDescription: z.string().max(500, 'Short description must be at most 500 characters').optional(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Category must be a valid MongoDB ObjectId'),
  subcategory: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Subcategory must be a valid MongoDB ObjectId').optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(
    z.object({
      sku: z.string().optional(),
      weight: z.number().positive('Weight must be a positive number'),
      metalType: z.enum(['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Yellow Gold']).optional(),
      purity: z.string().min(1, 'Purity is required'),
      color: z.enum(['Yellow', 'White', 'Rose', 'Multi-color']).optional(),
      size: z.string().optional(),
      price: z.number().positive('Price must be a positive number'),
      salePrice: z.number().positive('Sale price must be greater than 0').optional().or(z.number().nonpositive()).optional(),
      stockQuantity: z.number().nonnegative('Stock quantity cannot be negative').optional(),
      images: z.array(
        z.object({
          url: z.string().url('Image URL must be valid'),
          altText: z.string().optional()
        })
      ).optional(),
      gemstoneDetails: z.object({
        stoneType: z.string().optional(),
        caratWeight: z.number().optional(),
        clarity: z.string().optional(),
        cut: z.string().optional(),
        color: z.string().optional()
      }).optional()
    })
  ).min(1, 'At least one variant is required'),
  images: z.array(
    z.object({
      url: z.string().url('Image URL must be valid'),
      altText: z.string().optional()
    })
  ).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isOnSale: z.boolean().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  metaTitle: z.string().max(60, 'Meta title must be at most 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be at most 160 characters').optional(),
  seoKeywords: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional()
  }).optional(),
  weight: z.number().optional(),
  material: z.string().optional(),
  careInstructions: z.string().optional()
});

// Update product schema (all fields optional)
const updateProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(200, 'Product name must be at most 200 characters').optional(),
  slug: z.string().min(3, 'Product slug must be at least 3 characters').optional(),
  description: z.string().min(10, 'Product description must be at least 10 characters').optional(),
  shortDescription: z.string().max(500, 'Short description must be at most 500 characters').optional(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Category must be a valid MongoDB ObjectId').optional(),
  subcategory: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Subcategory must be a valid MongoDB ObjectId').optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(
    z.object({
      sku: z.string().optional(),
      weight: z.number().positive('Weight must be a positive number').optional(),
      metalType: z.enum(['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Yellow Gold']).optional(),
      purity: z.string().min(1, 'Purity is required').optional(),
      color: z.enum(['Yellow', 'White', 'Rose', 'Multi-color']).optional(),
      size: z.string().optional(),
      price: z.number().positive('Price must be a positive number').optional(),
      salePrice: z.number().positive('Sale price must be greater than 0').optional().or(z.number().nonpositive()).optional(),
      stockQuantity: z.number().nonnegative('Stock quantity cannot be negative').optional(),
      images: z.array(
        z.object({
          url: z.string().url('Image URL must be valid'),
          altText: z.string().optional()
        })
      ).optional(),
      gemstoneDetails: z.object({
        stoneType: z.string().optional(),
        caratWeight: z.number().optional(),
        clarity: z.string().optional(),
        cut: z.string().optional(),
        color: z.string().optional()
      }).optional()
    })
  ).optional(),
  images: z.array(
    z.object({
      url: z.string().url('Image URL must be valid'),
      altText: z.string().optional()
    })
  ).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isOnSale: z.boolean().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  metaTitle: z.string().max(60, 'Meta title must be at most 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be at most 160 characters').optional(),
  seoKeywords: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional()
  }).optional(),
  weight: z.number().optional(),
  material: z.string().optional(),
  careInstructions: z.string().optional()
});

module.exports = {
  productSchema,
  updateProductSchema
};
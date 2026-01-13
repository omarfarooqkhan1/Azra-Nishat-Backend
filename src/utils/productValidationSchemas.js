const { z } = require('zod');

// Product validation schema
const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(200, 'Product name must be at most 200 characters'),
  slug: z.string().min(3, 'Product slug must be at least 3 characters'),
  description: z.string().min(10, 'Product description must be at least 10 characters'),
  shortDescription: z.string().max(500, 'Short description must be at most 500 characters').optional(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Category must be a valid MongoDB ObjectId'),
  subcategory: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Subcategory must be a valid MongoDB ObjectId').optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(
    z.object({
      sku: z.string().min(1, 'SKU is required'),
      weight: z.number().positive('Weight must be a positive number'),
      metalType: z.enum(['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Yellow Gold']).optional(),
      purity: z.string().min(1, 'Purity is required'),
      color: z.enum(['Yellow', 'White', 'Rose', 'Multi-color']).optional(),
      size: z.string().optional(),
      price: z.number().positive('Price must be a positive number'),
      salePrice: z.number().positive().optional(),
      stockQuantity: z.number().nonnegative('Stock quantity cannot be negative').optional(),
      images: z.array(
        z.object({
          url: z.string().url('Image URL must be valid'),
          altText: z.string().optional()
        })
      ).optional()
    })
  ).min(1, 'At least one variant is required'),
  images: z.array(
    z.object({
      url: z.string().url('Image URL must be valid'),
      altText: z.string().optional()
    })
  ).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
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
const updateProductSchema = productSchema.deepPartial();

module.exports = {
  productSchema,
  updateProductSchema
};
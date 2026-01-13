const { z } = require('zod');
const BaseValidator = require('./BaseValidator');

class CategoryValidator extends BaseValidator {
  static createSchema = z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name must be at most 100 characters'),
    slug: z.string().min(2, 'Category slug must be at least 2 characters'),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
    parentCategory: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Parent category must be a valid MongoDB ObjectId').nullable().optional(),
    level: z.number().int().min(1).max(10).optional(),
    image: z.object({
      url: z.string().url('Image URL must be valid'),
      altText: z.string().optional()
    }).optional(),
    bannerImage: z.object({
      url: z.string().url('Banner image URL must be valid'),
      altText: z.string().optional()
    }).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
    metaTitle: z.string().max(60, 'Meta title must be at most 60 characters').optional(),
    metaDescription: z.string().max(160, 'Meta description must be at most 160 characters').optional(),
    seoKeywords: z.array(z.string()).optional()
  });

  static updateSchema = z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name must be at most 100 characters').optional(),
    slug: z.string().min(2, 'Category slug must be at least 2 characters').optional(),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
    parentCategory: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Parent category must be a valid MongoDB ObjectId').nullable().optional(),
    level: z.number().int().min(1).max(10).optional(),
    image: z.object({
      url: z.string().url('Image URL must be valid'),
      altText: z.string().optional()
    }).optional(),
    bannerImage: z.object({
      url: z.string().url('Banner image URL must be valid'),
      altText: z.string().optional()
    }).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
    metaTitle: z.string().max(60, 'Meta title must be at most 60 characters').optional(),
    metaDescription: z.string().max(160, 'Meta description must be at most 160 characters').optional(),
    seoKeywords: z.array(z.string()).optional()
  });

  static validateCreate(data) {
    return this.validate(this.createSchema, data);
  }

  static validateUpdate(data) {
    return this.validate(this.updateSchema, data);
  }
}

module.exports = CategoryValidator;
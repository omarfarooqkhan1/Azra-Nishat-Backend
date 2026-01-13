const { z } = require('zod');
const BaseValidator = require('./BaseValidator');

class ReviewValidator extends BaseValidator {
  static createSchema = z.object({
    product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Product must be a valid MongoDB ObjectId'),
    order: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Order must be a valid MongoDB ObjectId').optional(),
    rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    title: z.string().max(100, 'Title must be at most 100 characters').optional(),
    comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be at most 1000 characters'),
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional()
  });

  static updateSchema = z.object({
    rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5').optional(),
    title: z.string().max(100, 'Title must be at most 100 characters').optional(),
    comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be at most 1000 characters').optional(),
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional()
  });

  static reportSchema = z.object({
    reason: z.string().min(5, 'Report reason must be at least 5 characters').max(200, 'Report reason must be at most 200 characters')
  });

  static validateCreate(data) {
    return this.validate(this.createSchema, data);
  }

  static validateUpdate(data) {
    return this.validate(this.updateSchema, data);
  }

  static validateReport(data) {
    return this.validate(this.reportSchema, data);
  }
}

module.exports = ReviewValidator;
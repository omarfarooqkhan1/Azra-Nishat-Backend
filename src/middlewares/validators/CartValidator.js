const { z } = require('zod');
const BaseValidator = require('./BaseValidator');

class CartValidator extends BaseValidator {
  static addItemSchema = z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Product must be a valid MongoDB ObjectId'),
    quantity: z.number().int().positive('Quantity must be a positive integer')
  });

  static updateItemSchema = z.object({
    quantity: z.number().int().positive('Quantity must be a positive integer')
  });

  static validateAddItem(data) {
    return this.validate(this.addItemSchema, data);
  }

  static validateUpdateItem(data) {
    return this.validate(this.updateItemSchema, data);
  }
}

module.exports = CartValidator;
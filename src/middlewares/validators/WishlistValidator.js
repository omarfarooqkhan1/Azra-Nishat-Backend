const { z } = require('zod');
const BaseValidator = require('./BaseValidator');

class WishlistValidator extends BaseValidator {
  static addItemSchema = z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Product must be a valid MongoDB ObjectId')
  });

  static validateAddItem(data) {
    return this.validate(this.addItemSchema, data);
  }
}

module.exports = WishlistValidator;
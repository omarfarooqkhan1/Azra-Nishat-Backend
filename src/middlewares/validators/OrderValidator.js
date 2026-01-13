const { z } = require('zod');
const BaseValidator = require('./BaseValidator');

class OrderValidator extends BaseValidator {
  static createSchema = z.object({
    items: z.array(
      z.object({
        product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Product must be a valid MongoDB ObjectId'),
        variant: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Variant must be a valid MongoDB ObjectId').optional().or(z.literal('')).or(z.null()),
        quantity: z.number().int().positive('Quantity must be a positive integer'),
        price: z.number().positive('Price must be a positive number'),
        subtotal: z.number().positive('Subtotal must be a positive number')
      })
    ).min(1, 'At least one item is required'),
    shippingAddress: z.object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().optional().or(z.literal('')),
      zipCode: z.string().optional().or(z.literal('')),
      country: z.string().min(1, 'Country is required'),
      phone: z.string().optional()
    }),
    billingAddress: z.object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().optional().or(z.literal('')),
      zipCode: z.string().optional().or(z.literal('')),
      country: z.string().min(1, 'Country is required'),
      phone: z.string().optional()
    }).optional(),
    subtotal: z.number().nonnegative(),
    taxAmount: z.number().nonnegative().optional(),
    shippingCost: z.number().nonnegative().optional(),
    discountAmount: z.number().nonnegative().optional(),
    totalAmount: z.number().positive(),
    paymentMethod: z.enum(['cash_on_delivery', 'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe'], {
      errorMap: () => ({ message: 'Invalid payment method' })
    })
  });

  static processPaymentSchema = z.object({
    amount: z.number().positive('Amount must be a positive number'),
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid order ID is required'),
    paymentMethod: z.enum(['cash_on_delivery', 'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe'], {
      errorMap: () => ({ message: 'Invalid payment method' })
    })
  });

  static updateSchema = z.object({
    orderStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).optional(),
    paymentStatus: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']).optional(),
    trackingNumber: z.string().optional(),
    shippedDate: z.string().optional(),
    deliveredDate: z.string().optional()
  });

  static validateCreate(data) {
    return this.validate(this.createSchema, data);
  }

  static validateProcessPayment(data) {
    return this.validate(this.processPaymentSchema, data);
  }

  static validateUpdate(data) {
    return this.validate(this.updateSchema, data);
  }
}

module.exports = OrderValidator;
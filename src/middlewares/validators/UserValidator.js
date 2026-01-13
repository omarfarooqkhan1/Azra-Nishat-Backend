const { z } = require('zod');
const BaseValidator = require('./BaseValidator');

class UserValidator extends BaseValidator {
  static registerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
  });

  static loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
  });

  static updateProfileSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters').optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters').optional(),
    phone: z.string().optional(),
    email: z.string().email('Please enter a valid email').optional(),
    dateOfBirth: z.string().optional(),
    shippingAddress: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
      phone: z.string().optional()
    }).optional(),
    billingAddress: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
      phone: z.string().optional()
    }).optional(),
  });

  static updateDetailsSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Please enter a valid email').optional(),
  });

  static updateUserSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters').optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters').optional(),
    email: z.string().email('Please enter a valid email').optional(),
    phone: z.string().optional(),
    role: z.enum(['customer', 'admin', 'vendor']).optional(),
    isActive: z.boolean().optional(),
  });

  static validateRegister(data) {
    return this.validate(this.registerSchema, data);
  }

  static validateLogin(data) {
    return this.validate(this.loginSchema, data);
  }

  static validateUpdateDetails(data) {
    return this.validate(this.updateDetailsSchema, data);
  }

  static validateUpdateProfile(data) {
    return this.validate(this.updateProfileSchema, data);
  }

  static validateUpdateUser(data) {
    return this.validate(this.updateUserSchema, data);
  }
}

module.exports = UserValidator;
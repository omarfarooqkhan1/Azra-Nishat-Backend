const { z } = require('zod');

class BaseValidator {
  static validate(schema, data) {
    try {
      return {
        success: true,
        data: schema.parse(data)
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        };
      }
      throw error;
    }
  }
}

module.exports = BaseValidator;
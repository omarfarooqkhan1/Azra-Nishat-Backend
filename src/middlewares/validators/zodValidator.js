const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    // Parse the request body directly
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    next(error);
  }
};

module.exports = validate;
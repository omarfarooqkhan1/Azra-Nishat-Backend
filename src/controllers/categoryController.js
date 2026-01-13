const Category = require('../models/Category');
const Product = require('../models/Product');
const { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError,
  DuplicateResourceError
} = require('../errors');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a list of all product categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Successfully retrieved categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Number of categories returned
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const getCategories = async (req, res, next) => {
  try {
    logger.info('Get all categories request');

    const categories = await Category.find();

    logger.info('Successfully retrieved categories', { count: categories.length });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    logger.error('Get categories failed', {
      error: error.message,
      stack: error.stack
    });

    return next(new AppError('Could not retrieve categories', 500));
  }
};

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get single category
 *     description: Retrieve a specific category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Successfully retrieved category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error - Invalid category ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const getCategory = async (req, res, next) => {
  try {
    logger.info('Get category request', { categoryId: req.params.id });

    const category = await Category.findById(req.params.id);

    if (!category) {
      logger.warn('Category not found', { categoryId: req.params.id });
      return next(new NotFoundError('Category'));
    }

    logger.info('Successfully retrieved category', { categoryId: category._id });

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Get category failed', {
      error: error.message,
      categoryId: req.params.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid category ID'));
    }

    return next(new AppError('Could not retrieve category', 500));
  }
};

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create new category
 *     description: Create a new product category. Access restricted to admins.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Category already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const createCategory = async (req, res, next) => {
  try {
    logger.info('Create category request', { 
      userId: req.user.id,
      categoryName: req.body.name 
    });

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: req.body.name });
    if (existingCategory) {
      logger.warn('Create category failed - category already exists', { 
        userId: req.user.id,
        categoryName: req.body.name 
      });
      return next(new DuplicateResourceError('Category'));
    }

    const category = await Category.create(req.body);

    logger.info('Category created successfully', { 
      categoryId: category._id,
      categoryName: category.name,
      userId: req.user.id 
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Create category failed', {
      error: error.message,
      userId: req.user.id,
      categoryName: req.body.name,
      stack: error.stack
    });

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ValidationError('Validation Error', errors));
    }

    return next(new AppError('Could not create category', 500));
  }
};

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Update category
 *     description: Update an existing category. Access restricted to admins.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error - Invalid input or category ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const updateCategory = async (req, res, next) => {
  try {
    logger.info('Update category request', { 
      categoryId: req.params.id,
      userId: req.user.id 
    });

    const category = await Category.findById(req.params.id);

    if (!category) {
      logger.warn('Update category - category not found', { 
        categoryId: req.params.id,
        userId: req.user.id 
      });
      return next(new NotFoundError('Category'));
    }

    // Make sure user is admin
    if (req.user.role !== 'admin') {
      logger.warn('Update category - unauthorized access', { 
        categoryId: req.params.id,
        userId: req.user.id,
        role: req.user.role
      });
      return next(new ForbiddenError());
    }

    // Check if category with new name already exists
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({ name: req.body.name });
      if (existingCategory) {
        logger.warn('Update category failed - category already exists', { 
          userId: req.user.id,
          categoryName: req.body.name 
        });
        return next(new DuplicateResourceError('Category'));
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    );

    logger.info('Category updated successfully', { 
      categoryId: updatedCategory._id,
      userId: req.user.id 
    });

    res.status(200).json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    logger.error('Update category failed', {
      error: error.message,
      categoryId: req.params.id,
      userId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid category ID'));
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ValidationError('Validation Error', errors));
    }

    return next(new AppError('Could not update category', 500));
  }
};

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     description: Delete an existing category. Access restricted to admins. Cannot delete if products are using the category.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Empty object
 *                   example: {}
 *       400:
 *         description: Validation error - Invalid category ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Cannot delete category - it is being used by products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const deleteCategory = async (req, res, next) => {
  try {
    logger.info('Delete category request', { 
      categoryId: req.params.id,
      userId: req.user.id 
    });

    const category = await Category.findById(req.params.id);

    if (!category) {
      logger.warn('Delete category - category not found', { 
        categoryId: req.params.id,
        userId: req.user.id 
      });
      return next(new NotFoundError('Category'));
    }

    // Make sure user is admin
    if (req.user.role !== 'admin') {
      logger.warn('Delete category - unauthorized access', { 
        categoryId: req.params.id,
        userId: req.user.id,
        role: req.user.role
      });
      return next(new ForbiddenError());
    }

    // Check if any products are using this category
    const productsWithCategory = await Product.find({ category: req.params.id });
    if (productsWithCategory.length > 0) {
      logger.warn('Delete category failed - category in use by products', { 
        categoryId: req.params.id,
        userId: req.user.id,
        productCount: productsWithCategory.length
      });
      return next(new ValidationError('Cannot delete category - it is being used by products'));
    }

    await category.remove();

    logger.info('Category deleted successfully', { 
      categoryId: category._id,
      userId: req.user.id 
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Delete category failed', {
      error: error.message,
      categoryId: req.params.id,
      userId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid category ID'));
    }

    return next(new AppError('Could not delete category', 500));
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};
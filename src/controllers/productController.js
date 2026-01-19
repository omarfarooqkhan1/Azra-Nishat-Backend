const Product = require('../models/Product');
const Category = require('../models/Category');
const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
} = require('../errors');
const logger = require('../utils/logger');
const { generateUniqueSku } = require('../utils/helpers');
const { invalidateCache } = require('../middlewares/cache');
const {
  createPaginationMetadata,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams
} = require('../utils/pagination');

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *     400:
 *       description: Invalid parameters
 */
// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    logger.info('Get all products request', {
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      sort: req.query.sort
    });

    // Parse pagination parameters
    const { page, limit, skip } = parsePaginationParams(req);

    // Parse sort parameters
    const sortParams = { ...req.query };
    if (sortParams.sortBy === 'rating' || sortParams.sortBy === 'topRated') {
      sortParams.sortBy = 'rating.average';
    }
    const sort = parseSortParams({ query: sortParams }, ['name', 'price', 'createdAt', 'rating.average']);

    // Parse filter parameters
    const allowedFilters = ['category', 'search', 'minPrice', 'maxPrice', 'inStock', 'onSale'];
    const filters = parseFilterParams(req, allowedFilters);

    // Build query object
    let query = {};

    // Handle category filter
    if (req.query.category) {
      const category = await Category.findOne({
        $or: [
          { name: req.query.category },
          { slug: req.query.category }
        ]
      });
      if (!category) {
        logger.warn('Get products - category not found', { category: req.query.category });
        return next(new NotFoundError('Category'));
      }
      query.category = category._id;
    }

    // Handle search
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Apply additional filters
    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: parseFloat(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: parseFloat(req.query.maxPrice) };
    }
    if (req.query.inStock === 'true') {
      query.inStock = true;
    }
    if (req.query.onSale === 'true') {
      query.discountPrice = { $exists: true, $ne: null };
    }

    // Count total documents for pagination metadata
    const totalItems = await Product.countDocuments(query);

    // Execute query with pagination and sorting
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('reviews', 'rating comment createdAt user')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Create pagination metadata
    const pagination = createPaginationMetadata(totalItems, page, limit);

    logger.info('Successfully retrieved products', { count: products.length, totalItems });

    res.status(200).json({
      success: true,
      data: {
        data: products,
        pagination
      }
    });
  } catch (error) {
    logger.error('Get products failed', {
      error: error.message,
      query: req.query,
      stack: error.stack
    });

    return next(new AppError('Could not retrieve products', 500));
  }
};

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get single product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    logger.info('Get product request', { productId: req.params.id });

    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('reviews', 'rating comment createdAt user');

    if (!product) {
      logger.warn('Product not found', { productId: req.params.id });
      return next(new NotFoundError('Product'));
    }

    logger.info('Successfully retrieved product', { productId: product._id });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Get product failed', {
      error: error.message,
      productId: req.params.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid product ID'));
    }

    return next(new AppError('Could not retrieve product', 500));
  }
};

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin only
 */
// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    logger.info('Create product request', {
      userId: req.user.id,
      productName: req.body.name
    });

    // Check if category exists
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        logger.warn('Create product - category not found', {
          userId: req.user.id,
          categoryId: req.body.category
        });
        return next(new NotFoundError('Category'));
      }
    }

    // Auto-generate SKU for variants that don't have one
    if (req.body.variants && req.body.variants.length > 0) {
      req.body.variants = req.body.variants.map((variant, index) => {
        if (!variant.sku) {
          variant.sku = generateUniqueSku(req.body.name, index);
          logger.info('Auto-generated SKU for variant', {
            variantIndex: index,
            sku: variant.sku,
            productName: req.body.name
          });
        }
        return variant;
      });
    }

    const product = await Product.create(req.body);

    logger.info('Product created successfully', {
      productId: product._id,
      productName: product.name,
      userId: req.user.id
    });

    // Invalidate all cache related to products and featured/new products
    await invalidateCache('cache:*');

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Create product failed', {
      error: error.message,
      userId: req.user.id,
      productName: req.body.name,
      stack: error.stack
    });

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ValidationError('Validation Error', errors));
    }

    return next(new AppError('Could not create product', 500));
  }
};

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin only
 *       404:
 *         description: Product not found
 */
// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    logger.info('Update product request', {
      productId: req.params.id,
      userId: req.user.id
    });

    let product = await Product.findById(req.params.id);

    if (!product) {
      logger.warn('Update product - product not found', {
        productId: req.params.id,
        userId: req.user.id
      });
      return next(new NotFoundError('Product'));
    }

    // Make sure user is admin
    if (req.user.role !== 'admin') {
      logger.warn('Update product - unauthorized access', {
        productId: req.params.id,
        userId: req.user.id
      });
      return next(new ForbiddenError());
    }

    // Check if category exists
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        logger.warn('Update product - category not found', {
          userId: req.user.id,
          categoryId: req.body.category
        });
        return next(new NotFoundError('Category'));
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    logger.info('Product updated successfully', {
      productId: product._id,
      userId: req.user.id
    });

    // Invalidate all cache
    await invalidateCache('cache:*');

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Update product failed', {
      error: error.message,
      productId: req.params.id,
      userId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid product ID'));
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ValidationError('Validation Error', errors));
    }

    return next(new AppError('Could not update product', 500));
  }
};

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin only
 *       404:
 *         description: Product not found
 */
// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    logger.info('Delete product request', {
      productId: req.params.id,
      userId: req.user.id
    });

    const product = await Product.findById(req.params.id);

    if (!product) {
      logger.warn('Delete product - product not found', {
        productId: req.params.id,
        userId: req.user.id
      });
      return next(new NotFoundError('Product'));
    }

    // Make sure user is admin
    if (req.user.role !== 'admin') {
      logger.warn('Delete product - unauthorized access', {
        productId: req.params.id,
        userId: req.user.id
      });
      return next(new ForbiddenError());
    }

    await Product.findByIdAndDelete(req.params.id);

    logger.info('Product deleted successfully', {
      productId: req.params.id,
      userId: req.user.id
    });

    // Invalidate all cache
    await invalidateCache('cache:*');

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Delete product failed', {
      error: error.message,
      productId: req.params.id,
      userId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid product ID'));
    }

    return next(new AppError('Could not delete product', 500));
  }
};

// @desc    Get featured products
// @route   GET /api/v1/products/featured
// @access  Public
const getFeaturedProducts = async (req, res, next) => {
  try {
    logger.info('Get featured products request');

    // Parse pagination parameters
    const { page, limit, skip } = parsePaginationParams(req);

    // Parse sort parameters
    const sort = parseSortParams(req, ['name', 'price', 'createdAt', 'rating']);

    // Build query for featured products
    let query = { isFeatured: true };

    // Parse filter parameters
    const allowedFilters = ['category', 'search', 'minPrice', 'maxPrice', 'inStock'];
    const filters = parseFilterParams(req, allowedFilters);

    // Handle category filter
    if (req.query.category) {
      const category = await Category.findOne({
        $or: [
          { name: req.query.category },
          { slug: req.query.category }
        ]
      });
      if (!category) {
        logger.warn('Get featured products - category not found', { category: req.query.category });
        return next(new NotFoundError('Category'));
      }
      query.category = category._id;
    }

    // Handle search
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Apply additional filters
    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: parseFloat(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: parseFloat(req.query.maxPrice) };
    }
    if (req.query.inStock === 'true') {
      query.inStock = true;
    }

    // Count total documents for pagination metadata
    const totalItems = await Product.countDocuments(query);

    // Execute query with pagination and sorting
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Create pagination metadata
    const pagination = createPaginationMetadata(totalItems, page, limit);

    logger.info('Successfully retrieved featured products', { count: products.length, totalItems });

    res.status(200).json({
      success: true,
      data: {
        data: products,
        pagination
      }
    });
  } catch (error) {
    logger.error('Get featured products failed', {
      error: error.message,
      query: req.query,
      stack: error.stack
    });

    return next(new AppError('Could not retrieve featured products', 500));
  }
};

// @desc    Get new products
// @route   GET /api/v1/products/new
// @access  Public
const getNewProducts = async (req, res, next) => {
  try {
    logger.info('Get new products request');

    // Parse pagination parameters
    const { page, limit, skip } = parsePaginationParams(req);

    // Sort by creation date descending (newest first)
    const sort = { createdAt: -1 };

    // Build query for new products
    let query = { isNewArrival: true };

    // Parse filter parameters
    const allowedFilters = ['category', 'search', 'minPrice', 'maxPrice', 'inStock'];
    const filters = parseFilterParams(req, allowedFilters);

    // Handle category filter
    if (req.query.category) {
      const category = await Category.findOne({
        $or: [
          { name: req.query.category },
          { slug: req.query.category }
        ]
      });
      if (!category) {
        logger.warn('Get new products - category not found', { category: req.query.category });
        return next(new NotFoundError('Category'));
      }
      query.category = category._id;
    }

    // Handle search
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Apply additional filters
    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: parseFloat(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: parseFloat(req.query.maxPrice) };
    }
    if (req.query.inStock === 'true') {
      query.inStock = true;
    }

    // Count total documents for pagination metadata
    const totalItems = await Product.countDocuments(query);

    // Execute query with pagination and sorting
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Create pagination metadata
    const pagination = createPaginationMetadata(totalItems, page, limit);

    logger.info('Successfully retrieved new products', { count: products.length, totalItems });

    res.status(200).json({
      success: true,
      data: {
        data: products,
        pagination
      }
    });
  } catch (error) {
    logger.error('Get new products failed', {
      error: error.message,
      query: req.query,
      stack: error.stack
    });

    return next(new AppError('Could not retrieve new products', 500));
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getNewProducts
};
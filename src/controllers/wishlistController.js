const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError 
} = require('../errors');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/v1/wishlist:
 *   get:
 *     summary: Get user wishlist
 *     description: Retrieve the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
const getWishlist = async (req, res, next) => {
  try {
    logger.info('Get user wishlist request', { userId: req.user.id });

    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate('items', 'name price images');

    if (!wishlist) {
      logger.info('Wishlist not found, creating new wishlist', { userId: req.user.id });
      const newWishlist = new Wishlist({ user: req.user.id, items: [] });
      await newWishlist.save();
      return res.status(200).json({
        success: true,
        data: newWishlist
      });
    }

    logger.info('Successfully retrieved wishlist', { 
      userId: req.user.id,
      itemCount: wishlist.items.length
    });

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    logger.error('Get wishlist failed', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });

    return next(new AppError('Could not retrieve wishlist', 500));
  }
};

/**
 * @swagger
 * /api/v1/wishlist/items:
 *   post:
 *     summary: Add item to wishlist
 *     description: Add a product to the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to add
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Item added to wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
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
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Product already in wishlist
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
const addToWishlist = async (req, res, next) => {
  try {
    logger.info('Add item to wishlist request', { 
      userId: req.user.id,
      productId: req.body.productId
    });

    const { productId } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      logger.warn('Add to wishlist failed - product not found', { 
        userId: req.user.id,
        productId 
      });
      return next(new NotFoundError('Product'));
    }

    // Find or create user's wishlist
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, items: [] });
    }

    // Check if item already exists in wishlist
    const existingItemIndex = wishlist.items.findIndex(item => 
      item.toString() === productId
    );

    if (existingItemIndex > -1) {
      logger.warn('Add to wishlist failed - item already in wishlist', { 
        userId: req.user.id,
        productId 
      });
      return next(new ValidationError('Product already in wishlist'));
    }

    // Add new item
    wishlist.items.push(productId);
    await wishlist.save();

    logger.info('Item added to wishlist successfully', { 
      userId: req.user.id,
      productId
    });

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    logger.error('Add to wishlist failed', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ValidationError('Validation Error', errors));
    }

    return next(new AppError('Could not add item to wishlist', 500));
  }
};

/**
 * @swagger
 * /api/v1/wishlist/items/{productId}:
 *   delete:
 *     summary: Remove item from wishlist
 *     description: Remove a specific product from the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove
 *     responses:
 *       200:
 *         description: Item removed from wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 *       400:
 *         description: Validation error - Invalid product ID
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
 *       404:
 *         description: Wishlist or product not in wishlist
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
const removeFromWishlist = async (req, res, next) => {
  try {
    logger.info('Remove item from wishlist request', { 
      userId: req.user.id,
      productId: req.params.productId
    });

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      logger.warn('Remove from wishlist - wishlist not found', { 
        userId: req.user.id,
        productId: req.params.productId
      });
      return next(new NotFoundError('Wishlist'));
    }

    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(item => 
      item.toString() !== req.params.productId
    );

    if (wishlist.items.length === initialLength) {
      logger.warn('Remove from wishlist - item not found in wishlist', { 
        userId: req.user.id,
        productId: req.params.productId
      });
      return next(new NotFoundError('Product not in wishlist'));
    }

    await wishlist.save();

    logger.info('Item removed from wishlist successfully', { 
      userId: req.user.id,
      productId: req.params.productId
    });

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    logger.error('Remove from wishlist failed', {
      error: error.message,
      userId: req.user.id,
      productId: req.params.productId,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid product ID'));
    }

    return next(new AppError('Could not remove item from wishlist', 500));
  }
};

/**
 * @swagger
 * /api/v1/wishlist:
 *   delete:
 *     summary: Clear wishlist
 *     description: Remove all items from the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Wishlist not found
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
const clearWishlist = async (req, res, next) => {
  try {
    logger.info('Clear wishlist request', { userId: req.user.id });

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      logger.warn('Clear wishlist - wishlist not found', { userId: req.user.id });
      return next(new NotFoundError('Wishlist'));
    }

    wishlist.items = [];
    await wishlist.save();

    logger.info('Wishlist cleared successfully', { userId: req.user.id });

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    logger.error('Clear wishlist failed', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });

    return next(new AppError('Could not clear wishlist', 500));
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};
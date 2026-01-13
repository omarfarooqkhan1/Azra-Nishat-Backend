const Cart = require('../models/Cart');
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
 * /api/v1/cart:
 *   get:
 *     summary: Get user cart
 *     description: Retrieve the authenticated user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
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
const getCart = async (req, res, next) => {
  try {
    logger.info('Get user cart request', { userId: req.user.id });

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price images');

    if (!cart) {
      logger.info('Cart not found, creating new cart', { userId: req.user.id });
      const newCart = new Cart({ user: req.user.id, items: [] });
      await newCart.save();
      return res.status(200).json({
        success: true,
        data: newCart
      });
    }

    logger.info('Successfully retrieved cart', { 
      userId: req.user.id,
      itemCount: cart.items.length
    });

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error('Get cart failed', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });

    return next(new AppError('Could not retrieve cart', 500));
  }
};

/**
 * @swagger
 * /api/v1/cart/items:
 *   post:
 *     summary: Add item to cart
 *     description: Add a product to the authenticated user's shopping cart
 *     tags: [Cart]
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
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product to add
 *                 example: 507f1f77bcf86cd799439011
 *               quantity:
 *                 type: number
 *                 description: Quantity of the product to add
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const addToCart = async (req, res, next) => {
  try {
    logger.info('Add item to cart request', { 
      userId: req.user.id,
      productId: req.body.productId,
      quantity: req.body.quantity
    });

    const { productId, quantity } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      logger.warn('Add to cart failed - product not found', { 
        userId: req.user.id,
        productId 
      });
      return next(new NotFoundError('Product'));
    }

    // Check stock availability
    if (product.countInStock < quantity) {
      logger.warn('Add to cart failed - insufficient stock', { 
        userId: req.user.id,
        productId,
        requestedQty: quantity,
        availableQty: product.countInStock
      });
      return next(new ValidationError(`Only ${product.countInStock} items available`));
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      // Check if new quantity exceeds stock
      if (cart.items[existingItemIndex].quantity > product.countInStock) {
        logger.warn('Add to cart failed - exceeds stock after update', { 
          userId: req.user.id,
          productId,
          requestedQty: cart.items[existingItemIndex].quantity,
          availableQty: product.countInStock
        });
        return next(new ValidationError(`Only ${product.countInStock} items available`));
      }
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();

    logger.info('Item added to cart successfully', { 
      userId: req.user.id,
      productId,
      quantity
    });

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error('Add to cart failed', {
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

    return next(new AppError('Could not add item to cart', 500));
  }
};

/**
 * @swagger
 * /api/v1/cart/items/{itemId}:
 *   put:
 *     summary: Update cart item
 *     description: Update the quantity of a specific item in the authenticated user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the cart item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: New quantity for the cart item
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
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
 *         description: Cart, cart item, or product not found
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
const updateCartItem = async (req, res, next) => {
  try {
    logger.info('Update cart item request', { 
      userId: req.user.id,
      itemId: req.params.itemId,
      quantity: req.body.quantity
    });

    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      logger.warn('Update cart item - cart not found', { 
        userId: req.user.id,
        itemId: req.params.itemId
      });
      return next(new NotFoundError('Cart'));
    }

    const itemIndex = cart.items.findIndex(item => 
      item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      logger.warn('Update cart item - item not found in cart', { 
        userId: req.user.id,
        itemId: req.params.itemId
      });
      return next(new NotFoundError('Cart item'));
    }

    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      logger.warn('Update cart item - product not found', { 
        userId: req.user.id,
        productId: cart.items[itemIndex].product
      });
      return next(new NotFoundError('Product'));
    }

    // Check stock availability
    if (product.countInStock < quantity) {
      logger.warn('Update cart item - insufficient stock', { 
        userId: req.user.id,
        productId: cart.items[itemIndex].product,
        requestedQty: quantity,
        availableQty: product.countInStock
      });
      return next(new ValidationError(`Only ${product.countInStock} items available`));
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    logger.info('Cart item updated successfully', { 
      userId: req.user.id,
      itemId: req.params.itemId,
      quantity
    });

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error('Update cart item failed', {
      error: error.message,
      userId: req.user.id,
      itemId: req.params.itemId,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid item ID'));
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ValidationError('Validation Error', errors));
    }

    return next(new AppError('Could not update cart item', 500));
  }
};

/**
 * @swagger
 * /api/v1/cart/items/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     description: Remove a specific item from the authenticated user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the cart item to remove
 *     responses:
 *       200:
 *         description: Cart item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Validation error - Invalid item ID
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
 *         description: Cart or cart item not found
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
const removeCartItem = async (req, res, next) => {
  try {
    logger.info('Remove cart item request', { 
      userId: req.user.id,
      itemId: req.params.itemId
    });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      logger.warn('Remove cart item - cart not found', { 
        userId: req.user.id,
        itemId: req.params.itemId
      });
      return next(new NotFoundError('Cart'));
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => 
      item._id.toString() !== req.params.itemId
    );

    if (cart.items.length === initialLength) {
      logger.warn('Remove cart item - item not found in cart', { 
        userId: req.user.id,
        itemId: req.params.itemId
      });
      return next(new NotFoundError('Cart item'));
    }

    await cart.save();

    logger.info('Cart item removed successfully', { 
      userId: req.user.id,
      itemId: req.params.itemId
    });

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error('Remove cart item failed', {
      error: error.message,
      userId: req.user.id,
      itemId: req.params.itemId,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid item ID'));
    }

    return next(new AppError('Could not remove cart item', 500));
  }
};

/**
 * @swagger
 * /api/v1/cart:
 *   delete:
 *     summary: Clear cart
 *     description: Remove all items from the authenticated user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cart not found
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
const clearCart = async (req, res, next) => {
  try {
    logger.info('Clear cart request', { userId: req.user.id });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      logger.warn('Clear cart - cart not found', { userId: req.user.id });
      return next(new NotFoundError('Cart'));
    }

    cart.items = [];
    await cart.save();

    logger.info('Cart cleared successfully', { userId: req.user.id });

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error('Clear cart failed', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });

    return next(new AppError('Could not clear cart', 500));
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
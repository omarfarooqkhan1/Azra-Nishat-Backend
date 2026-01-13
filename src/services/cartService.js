const Cart = require('../models/Cart');
const Product = require('../models/Product');
const logger = require('../utils/logger');

const getCart = async (userId) => {
  try {
    logger.info('Getting user cart in service', { userId });

    const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images');

    if (!cart) {
      logger.info('Cart not found, creating new cart in service', { userId });
      const newCart = new Cart({ user: userId, items: [] });
      await newCart.save();
      return newCart;
    }

    logger.info('Cart retrieved successfully in service', { 
      userId,
      itemCount: cart.items.length
    });

    return cart;
  } catch (error) {
    logger.error('Get cart failed in service', {
      error: error.message,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

const addToCart = async (userId, productId, quantity) => {
  try {
    logger.info('Adding item to cart in service', { 
      userId, 
      productId, 
      quantity 
    });

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      logger.warn('Add to cart failed - product not found in service', { 
        userId, 
        productId 
      });
      throw new Error('Product not found');
    }

    // Check stock availability
    if (product.countInStock < quantity) {
      logger.warn('Add to cart failed - insufficient stock in service', { 
        userId, 
        productId,
        requestedQty: quantity,
        availableQty: product.countInStock
      });
      throw new Error(`Only ${product.countInStock} items available`);
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
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
        logger.warn('Add to cart failed - exceeds stock after update in service', { 
          userId,
          productId,
          requestedQty: cart.items[existingItemIndex].quantity,
          availableQty: product.countInStock
        });
        throw new Error(`Only ${product.countInStock} items available`);
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

    logger.info('Item added to cart successfully in service', { 
      userId, 
      productId, 
      quantity 
    });

    return cart;
  } catch (error) {
    logger.error('Add to cart failed in service', {
      error: error.message,
      userId,
      productId,
      stack: error.stack
    });
    throw error;
  }
};

const updateCartItem = async (userId, itemId, quantity) => {
  try {
    logger.info('Updating cart item in service', { 
      userId, 
      itemId, 
      quantity 
    });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      logger.warn('Update cart item - cart not found in service', { 
        userId,
        itemId
      });
      throw new Error('Cart not found');
    }

    const itemIndex = cart.items.findIndex(item => 
      item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      logger.warn('Update cart item - item not found in service', { 
        userId,
        itemId
      });
      throw new Error('Cart item not found');
    }

    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      logger.warn('Update cart item - product not found in service', { 
        userId,
        productId: cart.items[itemIndex].product
      });
      throw new Error('Product not found');
    }

    // Check stock availability
    if (product.countInStock < quantity) {
      logger.warn('Update cart item - insufficient stock in service', { 
        userId,
        productId: cart.items[itemIndex].product,
        requestedQty: quantity,
        availableQty: product.countInStock
      });
      throw new Error(`Only ${product.countInStock} items available`);
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    logger.info('Cart item updated successfully in service', { 
      userId, 
      itemId, 
      quantity 
    });

    return cart;
  } catch (error) {
    logger.error('Update cart item failed in service', {
      error: error.message,
      userId,
      itemId,
      stack: error.stack
    });
    throw error;
  }
};

const removeCartItem = async (userId, itemId) => {
  try {
    logger.info('Removing cart item in service', { 
      userId, 
      itemId 
    });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      logger.warn('Remove cart item - cart not found in service', { 
        userId,
        itemId
      });
      throw new Error('Cart not found');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => 
      item._id.toString() !== itemId
    );

    if (cart.items.length === initialLength) {
      logger.warn('Remove cart item - item not found in service', { 
        userId,
        itemId
      });
      throw new Error('Cart item not found');
    }

    await cart.save();

    logger.info('Cart item removed successfully in service', { 
      userId, 
      itemId 
    });

    return cart;
  } catch (error) {
    logger.error('Remove cart item failed in service', {
      error: error.message,
      userId,
      itemId,
      stack: error.stack
    });
    throw error;
  }
};

const clearCart = async (userId) => {
  try {
    logger.info('Clearing cart in service', { userId });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      logger.warn('Clear cart - cart not found in service', { userId });
      throw new Error('Cart not found');
    }

    cart.items = [];
    await cart.save();

    logger.info('Cart cleared successfully in service', { userId });

    return cart;
  } catch (error) {
    logger.error('Clear cart failed in service', {
      error: error.message,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
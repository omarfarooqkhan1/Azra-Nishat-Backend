const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const logger = require('../utils/logger');

const getWishlist = async (userId) => {
  try {
    logger.info('Getting user wishlist in service', { userId });

    const wishlist = await Wishlist.findOne({ user: userId }).populate('items', 'name price images');

    if (!wishlist) {
      logger.info('Wishlist not found, creating new wishlist in service', { userId });
      const newWishlist = new Wishlist({ user: userId, items: [] });
      await newWishlist.save();
      return newWishlist;
    }

    logger.info('Wishlist retrieved successfully in service', { 
      userId,
      itemCount: wishlist.items.length
    });

    return wishlist;
  } catch (error) {
    logger.error('Get wishlist failed in service', {
      error: error.message,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

const addToWishlist = async (userId, productId) => {
  try {
    logger.info('Adding item to wishlist in service', { 
      userId, 
      productId 
    });

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      logger.warn('Add to wishlist failed - product not found in service', { 
        userId, 
        productId 
      });
      throw new Error('Product not found');
    }

    // Find or create user's wishlist
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, items: [] });
    }

    // Check if item already exists in wishlist
    const existingItemIndex = wishlist.items.findIndex(item => 
      item.toString() === productId
    );

    if (existingItemIndex > -1) {
      logger.warn('Add to wishlist failed - item already in wishlist in service', { 
        userId, 
        productId 
      });
      throw new Error('Product already in wishlist');
    }

    // Add new item
    wishlist.items.push(productId);
    await wishlist.save();

    logger.info('Item added to wishlist successfully in service', { 
      userId, 
      productId 
    });

    return wishlist;
  } catch (error) {
    logger.error('Add to wishlist failed in service', {
      error: error.message,
      userId,
      productId,
      stack: error.stack
    });
    throw error;
  }
};

const removeFromWishlist = async (userId, productId) => {
  try {
    logger.info('Removing item from wishlist in service', { 
      userId, 
      productId 
    });

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      logger.warn('Remove from wishlist - wishlist not found in service', { 
        userId,
        productId
      });
      throw new Error('Wishlist not found');
    }

    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(item => 
      item.toString() !== productId
    );

    if (wishlist.items.length === initialLength) {
      logger.warn('Remove from wishlist - item not found in wishlist in service', { 
        userId,
        productId
      });
      throw new Error('Product not in wishlist');
    }

    await wishlist.save();

    logger.info('Item removed from wishlist successfully in service', { 
      userId, 
      productId 
    });

    return wishlist;
  } catch (error) {
    logger.error('Remove from wishlist failed in service', {
      error: error.message,
      userId,
      productId,
      stack: error.stack
    });
    throw error;
  }
};

const clearWishlist = async (userId) => {
  try {
    logger.info('Clearing wishlist in service', { userId });

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      logger.warn('Clear wishlist - wishlist not found in service', { userId });
      throw new Error('Wishlist not found');
    }

    wishlist.items = [];
    await wishlist.save();

    logger.info('Wishlist cleared successfully in service', { userId });

    return wishlist;
  } catch (error) {
    logger.error('Clear wishlist failed in service', {
      error: error.message,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};
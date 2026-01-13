const Product = require('../models/Product');
const logger = require('../utils/logger');

const updateStock = async (productId, quantityChange, type = 'adjustment') => {
  try {
    logger.info('Updating stock in service', { 
      productId, 
      quantityChange,
      type
    });

    const product = await Product.findById(productId);
    if (!product) {
      logger.warn('Update stock failed - product not found in service', { 
        productId,
        quantityChange
      });
      throw new Error('Product not found');
    }

    // Calculate new stock level
    const newStock = product.countInStock + quantityChange;

    // Ensure stock doesn't go negative
    if (newStock < 0) {
      logger.warn('Update stock failed - would result in negative stock in service', { 
        productId,
        currentStock: product.countInStock,
        quantityChange,
        newStock
      });
      throw new Error('Cannot reduce stock below 0');
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { countInStock: newStock },
      { new: true, runValidators: true }
    );

    logger.info('Stock updated successfully in service', { 
      productId,
      oldStock: product.countInStock,
      newStock,
      type
    });

    return updatedProduct;
  } catch (error) {
    logger.error('Update stock failed in service', {
      error: error.message,
      productId,
      quantityChange,
      stack: error.stack
    });
    throw error;
  }
};

const checkStockAvailability = async (productId, quantity) => {
  try {
    logger.info('Checking stock availability in service', { 
      productId, 
      quantity 
    });

    const product = await Product.findById(productId);

    if (!product) {
      logger.warn('Check stock availability failed - product not found in service', { 
        productId,
        quantity
      });
      return { available: false, message: 'Product not found' };
    }

    const isAvailable = product.countInStock >= quantity;

    logger.info('Stock availability checked in service', { 
      productId,
      requestedQuantity: quantity,
      availableQuantity: product.countInStock,
      available: isAvailable
    });

    return {
      available: isAvailable,
      currentStock: product.countInStock,
      requestedQuantity: quantity,
      message: isAvailable ? 'Sufficient stock available' : `Only ${product.countInStock} items available`
    };
  } catch (error) {
    logger.error('Check stock availability failed in service', {
      error: error.message,
      productId,
      quantity,
      stack: error.stack
    });
    throw error;
  }
};

const restockProduct = async (productId, quantity) => {
  try {
    logger.info('Restocking product in service', { 
      productId, 
      quantity 
    });

    if (quantity <= 0) {
      logger.warn('Restock failed - invalid quantity in service', { 
        productId,
        quantity
      });
      throw new Error('Quantity must be greater than 0');
    }

    const result = await updateStock(productId, quantity, 'restock');

    logger.info('Product restocked successfully in service', { 
      productId,
      quantityAdded: quantity
    });

    return result;
  } catch (error) {
    logger.error('Restock product failed in service', {
      error: error.message,
      productId,
      quantity,
      stack: error.stack
    });
    throw error;
  }
};

const getLowStockProducts = async (threshold = 10) => {
  try {
    logger.info('Getting low stock products in service', { threshold });

    const lowStockProducts = await Product.find({
      countInStock: { $lte: threshold, $gt: 0 }
    }).sort({ countInStock: 1 });

    logger.info('Low stock products retrieved in service', { 
      count: lowStockProducts.length,
      threshold
    });

    return lowStockProducts;
  } catch (error) {
    logger.error('Get low stock products failed in service', {
      error: error.message,
      threshold,
      stack: error.stack
    });
    throw error;
  }
};

const getOutOfStockProducts = async () => {
  try {
    logger.info('Getting out of stock products in service');

    const outOfStockProducts = await Product.find({
      countInStock: 0
    });

    logger.info('Out of stock products retrieved in service', { 
      count: outOfStockProducts.length
    });

    return outOfStockProducts;
  } catch (error) {
    logger.error('Get out of stock products failed in service', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  updateStock,
  checkStockAvailability,
  restockProduct,
  getLowStockProducts,
  getOutOfStockProducts
};
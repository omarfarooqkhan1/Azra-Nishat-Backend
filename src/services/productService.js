const Product = require('../models/Product');
const Category = require('../models/Category');
const logger = require('../utils/logger');

const getAllProducts = async (query) => {
  try {
    logger.info('Fetching all products in service', { query });

    // Filter by category if provided
    let filterQuery = {};
    if (query.category) {
      const category = await Category.findOne({ name: query.category });
      if (!category) {
        logger.warn('Category not found in service', { category: query.category });
        return [];
      }
      filterQuery.category = category._id;
    }

    if (query.search) {
      filterQuery.$text = { $search: query.search };
    }

    const products = await Product.find(filterQuery)
      .populate('category', 'name')
      .populate('reviews', 'rating comment createdAt');

    logger.info('Products fetched successfully in service', { count: products.length });

    return products;
  } catch (error) {
    logger.error('Products fetch failed in service', {
      error: error.message,
      query,
      stack: error.stack
    });
    throw error;
  }
};

const getProductById = async (productId) => {
  try {
    logger.info('Fetching product in service', { productId });

    const product = await Product.findById(productId)
      .populate('category', 'name')
      .populate('reviews', 'rating comment createdAt user');

    if (!product) {
      logger.warn('Product not found in service', { productId });
      return null;
    }

    logger.info('Product fetched successfully in service', { productId });

    return product;
  } catch (error) {
    logger.error('Product fetch failed in service', {
      error: error.message,
      productId,
      stack: error.stack
    });
    throw error;
  }
};

const createProduct = async (productData, userId) => {
  try {
    logger.info('Creating product in service', { 
      productName: productData.name,
      userId 
    });

    // Add user to product data
    const product = await Product.create({
      ...productData,
      user: userId
    });

    logger.info('Product created successfully in service', { 
      productId: product._id,
      productName: product.name,
      userId 
    });

    return product;
  } catch (error) {
    logger.error('Product creation failed in service', {
      error: error.message,
      productName: productData.name,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

const updateProduct = async (productId, productData, userId, userRole) => {
  try {
    logger.info('Updating product in service', { 
      productId,
      userId 
    });

    const product = await Product.findById(productId);

    if (!product) {
      logger.warn('Product not found for update in service', { 
        productId,
        userId 
      });
      return null;
    }

    // Make sure user is product owner or admin
    if (product.user.toString() !== userId && userRole !== 'admin') {
      logger.warn('Update product unauthorized in service', { 
        productId,
        userId,
        productOwner: product.user.toString()
      });
      throw new Error('Unauthorized');
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      productData,
      {
        new: true,
        runValidators: true
      }
    );

    logger.info('Product updated successfully in service', { 
      productId: updatedProduct._id,
      userId 
    });

    return updatedProduct;
  } catch (error) {
    logger.error('Product update failed in service', {
      error: error.message,
      productId,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

const deleteProduct = async (productId, userId, userRole) => {
  try {
    logger.info('Deleting product in service', { 
      productId,
      userId 
    });

    const product = await Product.findById(productId);

    if (!product) {
      logger.warn('Product not found for deletion in service', { 
        productId,
        userId 
      });
      return false;
    }

    // Make sure user is product owner or admin
    if (product.user.toString() !== userId && userRole !== 'admin') {
      logger.warn('Delete product unauthorized in service', { 
        productId,
        userId,
        productOwner: product.user.toString()
      });
      throw new Error('Unauthorized');
    }

    await product.remove();

    logger.info('Product deleted successfully in service', { 
      productId,
      userId 
    });

    return true;
  } catch (error) {
    logger.error('Product deletion failed in service', {
      error: error.message,
      productId,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
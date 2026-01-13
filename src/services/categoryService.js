const Category = require('../models/Category');
const Product = require('../models/Product');
const logger = require('../utils/logger');

const getAllCategories = async () => {
  try {
    logger.info('Getting all categories in service');

    const categories = await Category.find();

    logger.info('Categories retrieved successfully in service', { count: categories.length });

    return categories;
  } catch (error) {
    logger.error('Get all categories failed in service', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

const getCategoryById = async (categoryId) => {
  try {
    logger.info('Getting category in service', { categoryId });

    const category = await Category.findById(categoryId);

    if (!category) {
      logger.warn('Category not found in service', { categoryId });
      return null;
    }

    logger.info('Category retrieved successfully in service', { categoryId });

    return category;
  } catch (error) {
    logger.error('Get category failed in service', {
      error: error.message,
      categoryId,
      stack: error.stack
    });
    throw error;
  }
};

const createCategory = async (categoryData) => {
  try {
    logger.info('Creating category in service', { categoryName: categoryData.name });

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: categoryData.name });
    if (existingCategory) {
      logger.warn('Create category failed - category already exists in service', { 
        categoryName: categoryData.name 
      });
      throw new Error('Category already exists');
    }

    const category = await Category.create(categoryData);

    logger.info('Category created successfully in service', { 
      categoryId: category._id,
      categoryName: category.name
    });

    return category;
  } catch (error) {
    logger.error('Create category failed in service', {
      error: error.message,
      categoryName: categoryData.name,
      stack: error.stack
    });
    throw error;
  }
};

const updateCategory = async (categoryId, categoryData) => {
  try {
    logger.info('Updating category in service', { categoryId });

    const category = await Category.findById(categoryId);

    if (!category) {
      logger.warn('Update category - category not found in service', { categoryId });
      return null;
    }

    // Check if category with new name already exists
    if (categoryData.name && categoryData.name !== category.name) {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      if (existingCategory) {
        logger.warn('Update category failed - category already exists in service', { 
          categoryName: categoryData.name 
        });
        throw new Error('Category already exists');
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId, 
      categoryData, 
      {
        new: true,
        runValidators: true
      }
    );

    logger.info('Category updated successfully in service', { 
      categoryId: updatedCategory._id
    });

    return updatedCategory;
  } catch (error) {
    logger.error('Update category failed in service', {
      error: error.message,
      categoryId,
      stack: error.stack
    });
    throw error;
  }
};

const deleteCategory = async (categoryId) => {
  try {
    logger.info('Deleting category in service', { categoryId });

    const category = await Category.findById(categoryId);

    if (!category) {
      logger.warn('Delete category - category not found in service', { categoryId });
      return false;
    }

    // Check if any products are using this category
    const productsWithCategory = await Product.find({ category: categoryId });
    if (productsWithCategory.length > 0) {
      logger.warn('Delete category failed - category in use by products in service', { 
        categoryId,
        productCount: productsWithCategory.length
      });
      throw new Error('Cannot delete category - it is being used by products');
    }

    await category.remove();

    logger.info('Category deleted successfully in service', { categoryId });

    return true;
  } catch (error) {
    logger.error('Delete category failed in service', {
      error: error.message,
      categoryId,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
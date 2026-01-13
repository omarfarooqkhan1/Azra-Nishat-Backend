const Product = require('../models/Product');
const Category = require('../models/Category');
const logger = require('../utils/logger');

const searchProducts = async (query, filters = {}) => {
  try {
    logger.info('Searching products in service', { 
      query, 
      filters 
    });

    let searchQuery = {};

    // Build search query
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Add filters if provided
    if (filters.category) {
      const category = await Category.findOne({ name: filters.category });
      if (category) {
        searchQuery.category = category._id;
      } else {
        logger.warn('Search - category not found in service', { category: filters.category });
      }
    }

    if (filters.minPrice !== undefined) {
      searchQuery.price = { ...searchQuery.price, $gte: filters.minPrice };
    }

    if (filters.maxPrice !== undefined) {
      searchQuery.price = { ...searchQuery.price, $lte: filters.maxPrice };
    }

    if (filters.inStock !== undefined) {
      searchQuery.countInStock = { $gt: 0 };
    }

    const products = await Product.find(searchQuery)
      .populate('category', 'name')
      .populate('reviews', 'rating comment createdAt');

    logger.info('Products search completed in service', { 
      query,
      resultCount: products.length 
    });

    return products;
  } catch (error) {
    logger.error('Product search failed in service', {
      error: error.message,
      query,
      filters,
      stack: error.stack
    });
    throw error;
  }
};

const advancedSearch = async (params) => {
  try {
    logger.info('Advanced search in service', { params });

    let searchQuery = {};

    // Handle text search
    if (params.q) {
      searchQuery.$text = { $search: params.q };
    }

    // Handle category
    if (params.category) {
      const category = await Category.findOne({ name: params.category });
      if (category) {
        searchQuery.category = category._id;
      }
    }

    // Handle price range
    if (params.minPrice || params.maxPrice) {
      searchQuery.price = {};
      if (params.minPrice) searchQuery.price.$gte = parseFloat(params.minPrice);
      if (params.maxPrice) searchQuery.price.$lte = parseFloat(params.maxPrice);
    }

    // Handle rating
    if (params.minRating) {
      searchQuery.ratings = { $gte: parseFloat(params.minRating) };
    }

    // Handle in stock only
    if (params.inStock) {
      searchQuery.countInStock = { $gt: 0 };
    }

    // Handle sorting
    let sort = {};
    if (params.sort) {
      switch (params.sort) {
        case 'price-low':
          sort.price = 1;
          break;
        case 'price-high':
          sort.price = -1;
          break;
        case 'rating':
          sort.ratings = -1;
          break;
        case 'newest':
          sort.createdAt = -1;
          break;
        default:
          sort = { createdAt: -1 }; // Default sort
      }
    }

    // Handle pagination
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find(searchQuery)
      .populate('category', 'name')
      .populate('reviews', 'rating comment createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(searchQuery);

    logger.info('Advanced search completed in service', { 
      params,
      resultCount: products.length,
      totalResults: total
    });

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    logger.error('Advanced search failed in service', {
      error: error.message,
      params,
      stack: error.stack
    });
    throw error;
  }
};

const getSearchSuggestions = async (partialQuery) => {
  try {
    logger.info('Getting search suggestions in service', { partialQuery });

    // Get products that match the partial query
    const regex = new RegExp(partialQuery, 'i'); // Case insensitive
    const products = await Product.find({ name: { $regex: regex } })
      .select('name')
      .limit(5);

    // Get categories that match the partial query
    const categories = await Category.find({ name: { $regex: regex } })
      .select('name')
      .limit(5);

    const suggestions = {
      products: products.map(p => p.name),
      categories: categories.map(c => c.name)
    };

    logger.info('Search suggestions retrieved in service', { 
      partialQuery,
      productCount: suggestions.products.length,
      categoryCount: suggestions.categories.length
    });

    return suggestions;
  } catch (error) {
    logger.error('Get search suggestions failed in service', {
      error: error.message,
      partialQuery,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  searchProducts,
  advancedSearch,
  getSearchSuggestions
};
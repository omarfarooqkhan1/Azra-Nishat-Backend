const Review = require('../models/Review');
const Product = require('../models/Product');
const logger = require('../utils/logger');

const getReviewsByProduct = async (productId) => {
  try {
    logger.info('Getting reviews by product in service', { productId });

    const reviews = await Review.find({ product: productId })
      .populate('user', 'id name email')
      .populate('product', 'name');

    logger.info('Reviews retrieved successfully in service', { 
      productId,
      count: reviews.length 
    });

    return reviews;
  } catch (error) {
    logger.error('Get reviews by product failed in service', {
      error: error.message,
      productId,
      stack: error.stack
    });
    throw error;
  }
};

const getReviewById = async (reviewId) => {
  try {
    logger.info('Getting review in service', { reviewId });

    const review = await Review.findById(reviewId)
      .populate('user', 'id name email')
      .populate('product', 'name');

    if (!review) {
      logger.warn('Review not found in service', { reviewId });
      return null;
    }

    logger.info('Review retrieved successfully in service', { reviewId });

    return review;
  } catch (error) {
    logger.error('Get review failed in service', {
      error: error.message,
      reviewId,
      stack: error.stack
    });
    throw error;
  }
};

const createReview = async (productId, userId, rating, comment) => {
  try {
    logger.info('Creating review in service', { 
      productId, 
      userId,
      rating 
    });

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      logger.warn('Create review failed - product not found in service', { 
        productId,
        userId 
      });
      throw new Error('Product not found');
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId
    });

    if (existingReview) {
      logger.warn('Create review failed - user already reviewed product in service', { 
        productId,
        userId 
      });
      throw new Error('You have already reviewed this product');
    }

    // Create review
    const review = await Review.create({
      rating,
      comment,
      user: userId,
      product: productId
    });

    // Calculate average rating for the product
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    // Update product with new average rating
    await Product.findByIdAndUpdate(productId, {
      ratings: avgRating
    });

    logger.info('Review created successfully in service', { 
      reviewId: review._id,
      productId,
      userId 
    });

    return review;
  } catch (error) {
    logger.error('Create review failed in service', {
      error: error.message,
      productId,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

const updateReview = async (reviewId, userId, rating, comment) => {
  try {
    logger.info('Updating review in service', { 
      reviewId, 
      userId 
    });

    const review = await Review.findById(reviewId);

    if (!review) {
      logger.warn('Update review - review not found in service', { 
        reviewId,
        userId 
      });
      return null;
    }

    // Make sure user is review owner
    if (review.user.toString() !== userId) {
      logger.warn('Update review - unauthorized access in service', { 
        reviewId,
        userId,
        reviewOwner: review.user.toString()
      });
      throw new Error('Unauthorized');
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment },
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'id name email')
      .populate('product', 'name');

    // Recalculate average rating for the product
    const reviews = await Review.find({ product: review.product });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    // Update product with new average rating
    await Product.findByIdAndUpdate(review.product, {
      ratings: avgRating
    });

    logger.info('Review updated successfully in service', { 
      reviewId: updatedReview._id,
      userId 
    });

    return updatedReview;
  } catch (error) {
    logger.error('Update review failed in service', {
      error: error.message,
      reviewId,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

const deleteReview = async (reviewId, userId, userRole) => {
  try {
    logger.info('Deleting review in service', { 
      reviewId, 
      userId 
    });

    const review = await Review.findById(reviewId);

    if (!review) {
      logger.warn('Delete review - review not found in service', { 
        reviewId,
        userId 
      });
      return false;
    }

    // Make sure user is review owner or admin
    if (review.user.toString() !== userId && userRole !== 'admin') {
      logger.warn('Delete review - unauthorized access in service', { 
        reviewId,
        userId,
        reviewOwner: review.user.toString()
      });
      throw new Error('Unauthorized');
    }

    await review.remove();

    // Recalculate average rating for the product
    const reviews = await Review.find({ product: review.product });
    const avgRating = reviews.length > 0 
      ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length
      : 0;

    // Update product with new average rating
    await Product.findByIdAndUpdate(review.product, {
      ratings: avgRating
    });

    logger.info('Review deleted successfully in service', { 
      reviewId,
      userId 
    });

    return true;
  } catch (error) {
    logger.error('Delete review failed in service', {
      error: error.message,
      reviewId,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  getReviewsByProduct,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
};
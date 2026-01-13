const Review = require('../models/Review');
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
 * /api/v1/products/{productId}/reviews:
 *   get:
 *     summary: Get all reviews for a product
 *     description: Retrieve all reviews for a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Successfully retrieved reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Number of reviews returned
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const getReviews = async (req, res, next) => {
  try {
    logger.info('Get reviews request', { productId: req.params.productId });

    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'id name email')
      .populate('product', 'name');

    logger.info('Successfully retrieved reviews', { 
      productId: req.params.productId,
      count: reviews.length 
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    logger.error('Get reviews failed', {
      error: error.message,
      productId: req.params.productId,
      stack: error.stack
    });

    return next(new AppError('Could not retrieve reviews', 500));
  }
};

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     summary: Get single review
 *     description: Retrieve a specific review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Successfully retrieved review
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error - Invalid review ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Review not found
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
const getReview = async (req, res, next) => {
  try {
    logger.info('Get review request', { reviewId: req.params.id });

    const review = await Review.findById(req.params.id)
      .populate('user', 'id name email')
      .populate('product', 'name');

    if (!review) {
      logger.warn('Review not found', { reviewId: req.params.id });
      return next(new NotFoundError('Review'));
    }

    logger.info('Successfully retrieved review', { reviewId: review._id });

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    logger.error('Get review failed', {
      error: error.message,
      reviewId: req.params.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid review ID'));
    }

    return next(new AppError('Could not retrieve review', 500));
  }
};

/**
 * @swagger
 * /api/v1/products/{productId}/reviews:
 *   post:
 *     summary: Add review for a product
 *     description: Add a new review for a specific product. User must be authenticated.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 description: Rating for the product (1-5)
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 description: Review comment
 *                 example: 'Great product, highly recommend!'
 *     responses:
 *       201:
 *         description: Review added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Review'
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
 *         description: User has already reviewed this product
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
const addReview = async (req, res, next) => {
  try {
    logger.info('Add review request', { 
      productId: req.params.productId,
      userId: req.user.id 
    });

    const { rating, comment } = req.body;

    // Check if product exists
    const product = await Product.findById(req.params.productId);
    if (!product) {
      logger.warn('Add review failed - product not found', { 
        productId: req.params.productId,
        userId: req.user.id 
      });
      return next(new NotFoundError('Product'));
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      product: req.params.productId,
      user: req.user.id
    });

    if (existingReview) {
      logger.warn('Add review failed - user already reviewed product', { 
        productId: req.params.productId,
        userId: req.user.id 
      });
      return next(new ValidationError('You have already reviewed this product'));
    }

    // Create review
    const review = await Review.create({
      rating,
      comment,
      user: req.user.id,
      product: req.params.productId
    });

    // Calculate average rating for the product
    const reviews = await Review.find({ product: req.params.productId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    // Update product with new average rating
    await Product.findByIdAndUpdate(req.params.productId, {
      ratings: avgRating
    });

    logger.info('Review added successfully', { 
      reviewId: review._id,
      productId: req.params.productId,
      userId: req.user.id 
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    logger.error('Add review failed', {
      error: error.message,
      productId: req.params.productId,
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

    return next(new AppError('Could not add review', 500));
  }
};

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Update review
 *     description: Update an existing review. User must be the review owner or an admin.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 description: New rating for the product (1-5)
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 description: New review comment
 *                 example: 'Even better than I expected!'
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error - Invalid input or review ID
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
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Review not found
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
const updateReview = async (req, res, next) => {
  try {
    logger.info('Update review request', { 
      reviewId: req.params.id,
      userId: req.user.id 
    });

    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      logger.warn('Update review - review not found', { 
        reviewId: req.params.id,
        userId: req.user.id 
      });
      return next(new NotFoundError('Review'));
    }

    // Make sure user is review owner
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn('Update review - unauthorized access', { 
        reviewId: req.params.id,
        userId: req.user.id,
        reviewOwner: review.user.toString()
      });
      return next(new ForbiddenError());
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
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

    logger.info('Review updated successfully', { 
      reviewId: updatedReview._id,
      userId: req.user.id 
    });

    res.status(200).json({
      success: true,
      data: updatedReview
    });
  } catch (error) {
    logger.error('Update review failed', {
      error: error.message,
      reviewId: req.params.id,
      userId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid review ID'));
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ValidationError('Validation Error', errors));
    }

    return next(new AppError('Could not update review', 500));
  }
};

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     description: Delete an existing review. User must be the review owner or an admin.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Empty object
 *                   example: {}
 *       400:
 *         description: Validation error - Invalid review ID
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
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Review not found
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
const deleteReview = async (req, res, next) => {
  try {
    logger.info('Delete review request', { 
      reviewId: req.params.id,
      userId: req.user.id 
    });

    const review = await Review.findById(req.params.id);

    if (!review) {
      logger.warn('Delete review - review not found', { 
        reviewId: req.params.id,
        userId: req.user.id 
      });
      return next(new NotFoundError('Review'));
    }

    // Make sure user is review owner or admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn('Delete review - unauthorized access', { 
        reviewId: req.params.id,
        userId: req.user.id,
        reviewOwner: review.user.toString()
      });
      return next(new ForbiddenError());
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

    logger.info('Review deleted successfully', { 
      reviewId: review._id,
      userId: req.user.id 
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Delete review failed', {
      error: error.message,
      reviewId: req.params.id,
      userId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid review ID'));
    }

    return next(new AppError('Could not delete review', 500));
  }
};

module.exports = {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview
};
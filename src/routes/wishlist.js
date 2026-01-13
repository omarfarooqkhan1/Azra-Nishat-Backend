/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Wishlist management
 */

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /wishlist/items:
 *   post:
 *     summary: Add item to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Item added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /wishlist/items/{productId}:
 *   delete:
 *     summary: Remove item from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /wishlist:
 *   delete:
 *     summary: Clear wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: []
 *       401:
 *         description: Unauthorized
 */

const express = require('express');
const WishlistValidator = require('../middlewares/validators/WishlistValidator');
const validate = require('../middlewares/validators/zodValidator');
const wishlistController = require('../controllers/wishlistController');
const auth = require('../middlewares/auth');

const router = express.Router();

// @desc    Get user's wishlist
// @route   GET /api/v1/wishlist
// @access  Private
router.get('/', auth, wishlistController.getWishlist);

// @desc    Add item to wishlist
// @route   POST /api/v1/wishlist/items
// @access  Private
router.post('/items', [
  auth,
  validate(WishlistValidator.addItemSchema)
], wishlistController.addToWishlist);

// @desc    Remove item from wishlist
// @route   DELETE /api/v1/wishlist/items/:productId
// @access  Private
router.delete('/items/:productId', auth, wishlistController.removeFromWishlist);

// @desc    Clear wishlist
// @route   DELETE /api/v1/wishlist
// @access  Private
router.delete('/', auth, wishlistController.clearWishlist);

module.exports = router;
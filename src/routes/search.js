/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Product search functionality
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search products
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort order (price-low, price-high, rating, newest)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results
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
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalResults:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 */

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial search query
 *     responses:
 *       200:
 *         description: Search suggestions
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
 *                     products:
 *                       type: array
 *                       items:
 *                         type: string
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Query parameter 'q' is required
 */

const express = require('express');
const { advancedSearch, getSearchSuggestions } = require('../services/searchService');
const auth = require('../middlewares/auth');

const router = express.Router();

// @desc    Search products
// @route   GET /api/v1/search
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      q: searchQuery,
      page,
      limit,
      category,
      minPrice,
      maxPrice,
      sort
    } = req.query;

    const params = {
      q: searchQuery,
      category,
      minPrice,
      maxPrice,
      sort,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    };

    const searchResults = await advancedSearch(params);

    res.status(200).json({
      success: true,
      ...searchResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get search suggestions
// @route   GET /api/v1/search/suggestions
// @access  Public
router.get('/suggestions', async (req, res) => {
  try {
    const { q: partialQuery } = req.query;

    if (!partialQuery) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required'
      });
    }

    const suggestions = await getSearchSuggestions(partialQuery);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
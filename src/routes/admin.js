const express = require('express');
const {
  getDashboardStats,
  getSalesAnalytics,
  getUserAnalytics,
  getProductAnalytics,
  getOrderAnalytics
} = require('../services/adminService');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const Settings = require('../models/Settings');

const router = express.Router();

// @desc    Get site settings
// @route   GET /api/admin/settings
// @access  Private/Admin
router.get('/settings', auth, admin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update site settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
router.put('/settings', auth, admin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, req.body, {
        new: true,
        runValidators: true
      });
    }
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
router.get('/dashboard/stats', auth, admin, async (req, res) => {
  try {
    const dashboardStats = await getDashboardStats();

    res.status(200).json({
      success: true,
      ...dashboardStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get sales analytics
// @route   GET /api/admin/analytics/sales
// @access  Private/Admin
router.get('/analytics/sales', auth, admin, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const salesAnalytics = await getSalesAnalytics(period);

    res.status(200).json({
      success: true,
      ...salesAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private/Admin
router.get('/analytics/users', auth, admin, async (req, res) => {
  try {
    const userAnalytics = await getUserAnalytics();

    res.status(200).json({
      success: true,
      ...userAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get product analytics
// @route   GET /api/admin/analytics/products
// @access  Private/Admin
router.get('/analytics/products', auth, admin, async (req, res) => {
  try {
    const productAnalytics = await getProductAnalytics();

    res.status(200).json({
      success: true,
      ...productAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get order analytics
// @route   GET /api/admin/analytics/orders
// @access  Private/Admin
router.get('/analytics/orders', auth, admin, async (req, res) => {
  try {
    const orderAnalytics = await getOrderAnalytics();

    res.status(200).json({
      success: true,
      ...orderAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
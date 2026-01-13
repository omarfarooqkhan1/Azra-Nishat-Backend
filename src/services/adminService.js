const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../utils/logger');

const getDashboardStats = async () => {
  try {
    logger.info('Getting dashboard stats in service');

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Get new users this month
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: firstDayOfMonth } });

    // Products out of stock
    const productsOutOfStock = await Product.countDocuments({
      'variants.stockQuantity': 0
    });

    // Pending orders
    const pendingOrders = await Order.countDocuments({ orderStatus: 'shipped' }); // In this system, maybe 'pending' or 'confirmed'

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get total revenue
    const completedOrders = await Order.find({ orderStatus: 'delivered' });
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Calculate revenue growth (demo: 15%)
    const revenueGrowth = 15;

    const stats = {
      totalUsers,
      newUsersThisMonth,
      totalProducts,
      productsOutOfStock,
      totalOrders,
      pendingOrders,
      totalRevenue,
      revenueGrowth,
      recentOrders: recentOrders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        user: order.user ? { name: `${order.user.firstName} ${order.user.lastName}` } : null,
        totalAmount: order.totalAmount,
        status: order.orderStatus
      }))
    };

    return { data: stats };
  } catch (error) {
    logger.error('Get dashboard stats failed in service', { error: error.message });
    throw error;
  }
};

const getSalesAnalytics = async (period = 'monthly') => {
  try {
    // Demo implementation
    const analytics = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        { label: 'Revenue', data: [4000, 3000, 5000, 4500, 6000, 5500] },
        { label: 'Orders', data: [40, 30, 50, 45, 60, 55] }
      ]
    };
    return { data: analytics };
  } catch (error) {
    throw error;
  }
};

const getUserAnalytics = async () => {
  try {
    // Demo implementation
    const total = await User.countDocuments();
    const active = await User.countDocuments({ isActive: true });
    return { data: { total, active, newThisWeek: 5 } };
  } catch (error) {
    throw error;
  }
};

const getProductAnalytics = async () => {
  try {
    // Demo implementation
    const total = await Product.countDocuments();
    return { data: { total, topSelling: [], outOfStock: 2 } };
  } catch (error) {
    throw error;
  }
};

const getOrderAnalytics = async () => {
  try {
    // Demo implementation
    const total = await Order.countDocuments();
    const delivered = await Order.countDocuments({ orderStatus: 'delivered' });
    return { data: { total, delivered, statusCounts: {} } };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getDashboardStats,
  getSalesAnalytics,
  getUserAnalytics,
  getProductAnalytics,
  getOrderAnalytics
};
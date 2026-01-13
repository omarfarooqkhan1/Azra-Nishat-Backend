const Order = require('../models/Order');
const Product = require('../models/Product');
const logger = require('../utils/logger');

const createOrder = async (orderData) => {
  try {
    logger.info('Creating order in service', { 
      userId: orderData.user,
      itemCount: orderData.orderItems.length
    });

    const order = await Order.create(orderData);

    logger.info('Order created successfully in service', { 
      orderId: order._id,
      userId: orderData.user
    });

    return order;
  } catch (error) {
    logger.error('Order creation failed in service', {
      error: error.message,
      userId: orderData.user,
      stack: error.stack
    });
    throw error;
  }
};

const getOrderById = async (orderId) => {
  try {
    logger.info('Fetching order in service', { orderId });

    const order = await Order.findById(orderId);

    if (!order) {
      logger.warn('Order not found in service', { orderId });
      return null;
    }

    logger.info('Order fetched successfully in service', { orderId });

    return order;
  } catch (error) {
    logger.error('Order fetch failed in service', {
      error: error.message,
      orderId,
      stack: error.stack
    });
    throw error;
  }
};

const getAllOrders = async (userId, role) => {
  try {
    logger.info('Fetching all orders in service', { 
      userId, 
      role 
    });

    let orders;
    if (role === 'admin') {
      orders = await Order.find()
        .populate('user', 'id name email')
        .populate('orderItems.product', 'name price')
        .sort('-createdAt');
    } else {
      orders = await Order.find({ user: userId })
        .populate('orderItems.product', 'name price')
        .sort('-createdAt');
    }

    logger.info('Orders fetched successfully in service', { 
      count: orders.length,
      userId 
    });

    return orders;
  } catch (error) {
    logger.error('Orders fetch failed in service', {
      error: error.message,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

const updateOrderStatus = async (orderId, statusField, statusValue) => {
  try {
    logger.info('Updating order status in service', { 
      orderId, 
      statusField, 
      statusValue 
    });

    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn('Order not found for status update in service', { orderId });
      return null;
    }

    order[statusField] = statusValue;
    if (statusField === 'isPaid') {
      order.paidAt = Date.now();
    } else if (statusField === 'isDelivered') {
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    logger.info('Order status updated successfully in service', { 
      orderId, 
      statusField, 
      statusValue 
    });

    return updatedOrder;
  } catch (error) {
    logger.error('Order status update failed in service', {
      error: error.message,
      orderId,
      statusField,
      stack: error.stack
    });
    throw error;
  }
};

const deleteOrder = async (orderId) => {
  try {
    logger.info('Deleting order in service', { orderId });

    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn('Order not found for deletion in service', { orderId });
      return false;
    }

    await order.remove();

    logger.info('Order deleted successfully in service', { orderId });

    return true;
  } catch (error) {
    logger.error('Order deletion failed in service', {
      error: error.message,
      orderId,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder
};
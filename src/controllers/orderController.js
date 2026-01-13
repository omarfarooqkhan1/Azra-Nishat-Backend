const Order = require('../models/Order');
const Product = require('../models/Product');
const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
} = require('../errors');
const logger = require('../utils/logger');
const {
  createPaginationMetadata,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams
} = require('../utils/pagination');
const {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderStatusUpdateEmail
} = require('../utils/emailService');
const User = require('../models/User');

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    logger.info('Get all orders request', {
      userId: req.user.id,
      role: req.user.role
    });

    // Parse pagination parameters
    const { page, limit, skip } = parsePaginationParams(req);

    // Parse sort parameters
    const sort = parseSortParams(req, ['createdAt', 'updatedAt', 'totalPrice', 'orderStatus']);

    // Parse filter parameters
    const allowedFilters = ['orderStatus', 'paymentStatus', 'dateFrom', 'dateTo'];
    const filters = parseFilterParams(req, allowedFilters);

    // Build query object
    let query = {};

    // Apply filters
    if (req.query.orderStatus) {
      query.orderStatus = req.query.orderStatus;
    }
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.dateFrom) {
      query.createdAt = { ...query.createdAt, $gte: new Date(req.query.dateFrom) };
    }
    if (req.query.dateTo) {
      query.createdAt = { ...query.createdAt, $lte: new Date(req.query.dateTo) };
    }

    let orders;
    let totalItems;

    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      // Admin can see all orders
      totalItems = await Order.countDocuments(query);
      orders = await Order.find(query)
        .populate('user', 'id firstName lastName email')
        .populate('items.product', 'name price')
        .sort(sort)
        .skip(skip)
        .limit(limit);
    } else {
      // Regular user can only see their own orders
      query.user = req.user.id;
      totalItems = await Order.countDocuments(query);
      orders = await Order.find(query)
        .populate('items.product', 'name price')
        .sort(sort)
        .skip(skip)
        .limit(limit);
    }

    // Create pagination metadata
    const pagination = createPaginationMetadata(totalItems, page, limit);

    logger.info('Successfully retrieved orders', {
      count: orders.length,
      totalItems,
      userId: req.user.id,
      role: req.user.role
    });

    res.status(200).json({
      success: true,
      data: {
        data: orders,
        pagination
      }
    });
  } catch (error) {
    logger.error('Get orders failed', {
      error: error.message,
      userId: req.user.id,
      role: req.user.role,
      stack: error.stack
    });

    return next(new AppError('Could not retrieve orders', 500));
  }
};

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get single order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrder = async (req, res, next) => {
  try {
    logger.info('Get order request', {
      orderId: req.params.id,
      userId: req.user.id
    });

    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name images price');

    if (!order) {
      logger.warn('Order not found', {
        orderId: req.params.id,
        userId: req.user.id
      });
      return next(new NotFoundError('Order'));
    }

    // Make sure user is order owner or admin
    const isOwner = order.user && order.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    if (!isOwner && !isAdmin) {
      logger.warn('Get order - unauthorized access', {
        orderId: req.params.id,
        userId: req.user.id,
        orderOwner: order.user._id.toString()
      });
      return next(new ForbiddenError());
    }

    logger.info('Successfully retrieved order', {
      orderId: order._id,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Get order failed', {
      error: error.message,
      orderId: req.params.id,
      userId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid order ID'));
    }

    return next(new AppError('Could not retrieve order', 500));
  }
};

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    logger.info('Create order request', {
      userId: req.user.id,
      orderData: req.body
    });

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      subtotal,
      taxAmount,
      shippingCost,
      discountAmount,
      totalAmount
    } = req.body;

    if (!items || items.length === 0) {
      logger.warn('Create order failed - no items', { userId: req.user.id });
      return next(new ValidationError('Order must have at least one item'));
    }

    // Verify products exist and have enough stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        logger.warn('Create order failed - product not found', {
          productId: item.product,
          userId: req.user.id
        });
        return next(new NotFoundError('Product'));
      }

      // Check stock if product variants are used or just product
      // For now, assume simplified stock check on product if variants not specified
      // In a real app, you'd check the specific variant's stock
    }

    // Generate unique order number
    const date = new Date();
    const dateStr = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomStr}`;

    // Create order
    const order = await Order.create({
      orderNumber,
      user: req.user.id,
      items,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      subtotal,
      taxAmount: taxAmount || 0,
      shippingCost: shippingCost || 0,
      discountAmount: discountAmount || 0,
      totalAmount
    });

    logger.info('Order created successfully', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: req.user.id,
      itemCount: items.length
    });

    // Send confirmation email
    try {
      const populatedOrder = await Order.findById(order._id).populate('items.product', 'name price');
      const user = await User.findById(req.user.id);
      if (user && populatedOrder) {
        await sendOrderConfirmationEmail(user, populatedOrder);
      }
    } catch (emailError) {
      logger.error('Failed to send order confirmation email', {
        error: emailError.message,
        orderId: order._id,
        userId: req.user.id
      });
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Create order failed', {
      error: error.message,
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

    return next(new AppError('Could not create order', 500));
  }
};

/**
 * @swagger
 * /orders/{id}/pay:
 *   put:
 *     summary: Update order to paid
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order updated to paid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
// @desc    Update order to paid
// @route   PUT /api/v1/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res, next) => {
  try {
    logger.info('Update order to paid request', {
      orderId: req.params.id,
      userId: req.user.id
    });

    const order = await Order.findById(req.params.id);

    if (!order) {
      logger.warn('Update order to paid - order not found', {
        orderId: req.params.id,
        userId: req.user.id
      });
      return next(new NotFoundError('Order'));
    }

    // Make sure user is order owner or admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      logger.warn('Update order to paid - unauthorized access', {
        orderId: req.params.id,
        userId: req.user.id,
        orderOwner: order.user.toString()
      });
      return next(new ForbiddenError());
    }

    // Update order status
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address
    };

    const updatedOrder = await order.save();

    logger.info('Order updated to paid', {
      orderId: updatedOrder._id,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    logger.error('Update order to paid failed', {
      error: error.message,
      orderId: req.params.id,
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

    return next(new AppError('Could not update order to paid', 500));
  }
};

/**
 * @swagger
 * /orders/{id}/deliver:
 *   put:
 *     summary: Update order to delivered
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order updated to delivered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin only
 *       404:
 *         description: Order not found
 */
// @desc    Update order to delivered
// @route   PUT /api/v1/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res, next) => {
  try {
    logger.info('Update order to delivered request', {
      orderId: req.params.id,
      userId: req.user.id
    });

    const order = await Order.findById(req.params.id);

    if (!order) {
      logger.warn('Update order to delivered - order not found', {
        orderId: req.params.id,
        userId: req.user.id
      });
      return next(new NotFoundError('Order'));
    }

    // Make sure user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      logger.warn('Update order to delivered - unauthorized access', {
        orderId: req.params.id,
        userId: req.user.id,
        role: req.user.role
      });
      return next(new ForbiddenError());
    }

    // Update order status
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.orderStatus = 'delivered';

    const updatedOrder = await (await order.save()).populate('user');

    logger.info('Order updated to delivered', {
      orderId: updatedOrder._id,
      userId: req.user.id
    });

    // Send email
    try {
      await sendOrderDeliveredEmail(updatedOrder.user, updatedOrder);
    } catch (emailError) {
      logger.error('Failed to send order delivered email', {
        error: emailError.message,
        orderId: updatedOrder._id
      });
    }

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    logger.error('Update order to delivered failed', {
      error: error.message,
      orderId: req.params.id,
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

    return next(new AppError('Could not update order to delivered', 500));
  }
};

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin only
 *       404:
 *         description: Order not found
 */
// @desc    Delete order
// @route   DELETE /api/v1/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res, next) => {
  try {
    logger.info('Delete order request', {
      orderId: req.params.id,
      userId: req.user.id
    });

    const order = await Order.findById(req.params.id);

    if (!order) {
      logger.warn('Delete order - order not found', {
        orderId: req.params.id,
        userId: req.user.id
      });
      return next(new NotFoundError('Order'));
    }

    // Make sure user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      logger.warn('Delete order - unauthorized access', {
        orderId: req.params.id,
        userId: req.user.id,
        role: req.user.role
      });
      return next(new ForbiddenError());
    }

    await order.deleteOne();

    logger.info('Order deleted successfully', {
      orderId: order._id,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Delete order failed', {
      error: error.message,
      orderId: req.params.id,
      userId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid order ID'));
    }

    return next(new AppError('Could not delete order', 500));
  }
};

/**
 * @swagger
 * /payments/process:
 *   post:
 *     summary: Process payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 required: true
 *               orderId:
 *                 type: string
 *                 required: true
 *               paymentMethod:
 *                 type: string
 *                 required: true
 *                 enum: [cash_on_delivery, credit_card, debit_card, bank_transfer, paypal, stripe]
 *     responses:
 *       200:
 *         description: Payment processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
// @desc    Process payment
// @route   POST /api/v1/payments/process
// @access  Private
const processPayment = async (req, res, next) => {
  try {
    logger.info('Process payment request', {
      userId: req.user.id,
      orderId: req.body.orderId,
      paymentMethod: req.body.paymentMethod
    });

    const { amount, orderId, paymentMethod } = req.body;

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn('Process payment failed - order not found', {
        orderId,
        userId: req.user.id
      });
      return next(new NotFoundError('Order'));
    }

    // Make sure user is order owner
    if (order.user.toString() !== req.user.id) {
      logger.warn('Process payment - unauthorized access', {
        orderId,
        userId: req.user.id,
        orderOwner: order.user.toString()
      });
      return next(new ForbiddenError());
    }

    // Process payment based on method
    switch (paymentMethod) {
      case 'cash_on_delivery':
        // For COD, just update order status
        order.paymentMethod = 'cash_on_delivery';
        order.isPaid = true;
        order.paidAt = Date.now();
        break;

      case 'credit_card':
      case 'debit_card':
      case 'paypal':
      case 'stripe':
        // For online payments, we would integrate with payment gateway
        // This is a simplified version - in real app, you'd use Stripe/PayPal SDK
        order.paymentMethod = paymentMethod;
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: `payment_${Date.now()}`,
          status: 'completed',
          update_time: new Date().toISOString(),
          email_address: req.user.email
        };
        break;

      default:
        logger.warn('Process payment failed - invalid payment method', {
          paymentMethod,
          userId: req.user.id
        });
        return next(new ValidationError('Invalid payment method'));
    }

    await order.save();

    logger.info('Payment processed successfully', {
      orderId: order._id,
      userId: req.user.id,
      paymentMethod
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Process payment failed', {
      error: error.message,
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

    return next(new AppError('Could not process payment', 500));
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/v1/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id).populate('user');

    if (!order) {
      return next(new NotFoundError('Order'));
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = status;

    if (status === 'shipped') {
      order.shippedDate = Date.now();
    } else if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredDate = Date.now();
    }

    const updatedOrder = await order.save();

    // Send email notifications based on status
    try {
      const populatedOrder = await Order.findById(updatedOrder._id).populate('items.product', 'name price');
      if (oldStatus !== 'shipped' && status === 'shipped') {
        await sendOrderShippedEmail(order.user, populatedOrder);
      } else if (oldStatus !== 'delivered' && status === 'delivered') {
        await sendOrderDeliveredEmail(order.user, populatedOrder);
      } else if (oldStatus !== status) {
        // For other status changes (confirmed, processing, cancelled, etc.)
        await sendOrderStatusUpdateEmail(order.user, populatedOrder);
      }
    } catch (emailError) {
      logger.error('Failed to send status update email', {
        error: emailError.message,
        orderId: order._id,
        status
      });
    }

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    logger.error('Update order status failed', error);
    return next(new AppError('Could not update order status', 500));
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderStatus,
  deleteOrder,
  processPayment
};
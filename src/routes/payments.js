const express = require('express');
const OrderValidator = require('../middlewares/validators/OrderValidator');
const validate = require('../middlewares/validators/zodValidator');
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const router = express.Router();

// @desc    Process payment
// @route   POST /api/v1/payments/process
// @access  Private
router.post('/process', [
  auth,
  validate(OrderValidator.processPaymentSchema)
], orderController.processPayment);

// @desc    Update order to paid
// @route   PUT /api/v1/orders/:id/pay
// @access  Private
router.put('/orders/:id/pay', auth, orderController.updateOrderToPaid);

module.exports = router;
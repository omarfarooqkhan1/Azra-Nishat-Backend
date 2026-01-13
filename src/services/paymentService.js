const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

const createPaymentIntent = async (amount, currency = 'usd', description = 'E-commerce purchase') => {
  try {
    logger.info('Creating payment intent in service', { 
      amount, 
      currency,
      description 
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency,
      description,
      metadata: {
        integration_check: 'accept_a_payment',
      },
    });

    logger.info('Payment intent created successfully in service', { 
      paymentIntentId: paymentIntent.id,
      amount,
      currency
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Create payment intent failed in service', {
      error: error.message,
      amount,
      currency,
      stack: error.stack
    });
    throw error;
  }
};

const capturePayment = async (paymentIntentId) => {
  try {
    logger.info('Capturing payment in service', { paymentIntentId });

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    logger.info('Payment captured successfully in service', { 
      paymentIntentId,
      status: paymentIntent.status
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Capture payment failed in service', {
      error: error.message,
      paymentIntentId,
      stack: error.stack
    });
    throw error;
  }
};

const refundPayment = async (paymentIntentId, amount = null) => {
  try {
    logger.info('Refunding payment in service', { 
      paymentIntentId,
      amount 
    });

    const refundData = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Stripe expects amount in cents
    }

    const refund = await stripe.refunds.create(refundData);

    logger.info('Payment refunded successfully in service', { 
      refundId: refund.id,
      paymentIntentId,
      amount: refund.amount / 100 // Convert back to dollars
    });

    return refund;
  } catch (error) {
    logger.error('Refund payment failed in service', {
      error: error.message,
      paymentIntentId,
      stack: error.stack
    });
    throw error;
  }
};

const getPaymentDetails = async (paymentIntentId) => {
  try {
    logger.info('Getting payment details in service', { paymentIntentId });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    logger.info('Payment details retrieved successfully in service', { 
      paymentIntentId,
      status: paymentIntent.status
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Get payment details failed in service', {
      error: error.message,
      paymentIntentId,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  createPaymentIntent,
  capturePayment,
  refundPayment,
  getPaymentDetails
};
const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  secure: process.env.MAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message (plain text)
 * @param {string} options.html - Email message (HTML)
 */
const sendEmail = async (options) => {
  logger.info(`Sending email to ${options.email} with subject: ${options.subject}`);

  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Message sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email send failed', error);
    throw error;
  }
};

/**
 * Helper to format address
 */
const formatAddress = (address) => {
  if (!address) return 'N/A';
  return `
    ${address.street}<br>
    ${address.city}, ${address.state || ''} ${address.zipCode || ''}<br>
    ${address.country}<br>
    ${address.phone ? `Phone: ${address.phone}` : ''}
  `;
};

/**
 * Helper to render order items table
 */
const renderOrderItems = (items) => {
  if (!items || items.length === 0) return '';

  const rows = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product?.name || 'Product'}
        ${item.variant ? `<br><small style="color: #666;">${item.variant.metalType || ''} ${item.variant.purity || ''} ${item.variant.size || ''}</small>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">PKR ${item.price.toLocaleString()}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">PKR ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f8f8f8;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

/**
 * Send order confirmation email
 * @param {Object} user - User object
 * @param {Object} order - Order object
 */
const sendOrderConfirmationEmail = async (user, order) => {
  const subject = `Order Confirmation - #${order.orderNumber}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #800020; margin-bottom: 10px;">Azra Nishat</h1>
        <h2 style="color: #444; margin-top: 0;">Order Confirmation</h2>
      </div>
      
      <p>Dear ${user.firstName},</p>
      <p>Thank you for your order! We've received your request and are currently processing it. Your order number is <strong>#${order.orderNumber}</strong>.</p>
      
      <h3 style="border-bottom: 2px solid #800020; padding-bottom: 5px; color: #800020;">Order Details</h3>
      ${renderOrderItems(order.items)}

      <div style="margin-top: 20px; text-align: right;">
        <p style="margin: 5px 0;"><strong>Subtotal:</strong> PKR ${order.subtotal.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Shipping:</strong> ${order.shippingCost === 0 ? 'FREE' : `PKR ${order.shippingCost.toLocaleString()}`}</p>
        ${order.taxAmount > 0 ? `<p style="margin: 5px 0;"><strong>Tax:</strong> PKR ${order.taxAmount.toLocaleString()}</p>` : ''}
        <p style="font-size: 18px; color: #800020; margin: 10px 0;"><strong>Total Amount:</strong> PKR ${order.totalAmount.toLocaleString()}</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 30px; gap: 20px;">
        <div style="flex: 1; background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
          <h4 style="margin-top: 0; color: #800020;">Shipping Address</h4>
          <p style="font-size: 14px; line-height: 1.5; margin: 0;">${formatAddress(order.shippingAddress)}</p>
        </div>
        <div style="flex: 1; background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
          <h4 style="margin-top: 0; color: #800020;">Payment Method</h4>
          <p style="font-size: 14px; text-transform: capitalize; margin: 0;">${order.paymentMethod.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <p style="margin-top: 30px;">We'll notify you as soon as your order has been shipped. If you have any questions, please reply to this email.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Azra Nishat. All rights reserved.</p>
        <p>Premium Jewelry, Cosmetics & Couture</p>
      </div>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html
  });
};

/**
 * Send order status update email
 * @param {Object} user - User object
 * @param {Object} order - Order object
 */
const sendOrderShippedEmail = async (user, order) => {
  const subject = `Your Order Has Been Shipped! - #${order.orderNumber}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #800020; margin-bottom: 10px;">Azra Nishat</h1>
        <h2 style="color: #444; margin-top: 0;">Order Shipped</h2>
      </div>

      <p>Dear ${user.firstName},</p>
      <p>Great news! Your order <strong>#${order.orderNumber}</strong> has been shipped and is on its way to you.</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #800020;">Shipping Information</h3>
        <p><strong>Tracking Number:</strong> ${order.trackingNumber || 'Pending'}</p>
        <p><strong>Shipping To:</strong><br>${formatAddress(order.shippingAddress)}</p>
      </div>

      <h3 style="color: #800020;">Items in this Shipment</h3>
      ${renderOrderItems(order.items)}

      <p style="margin-top: 30px;">Thank you for choosing Azra Nishat. We hope you enjoy your purchase!</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Azra Nishat. All rights reserved.</p>
        <p>Premium Jewelry, Cosmetics & Couture</p>
      </div>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html
  });
};

/**
 * Send order delivered email
 * @param {Object} user - User object
 * @param {Object} order - Order object
 */
const sendOrderDeliveredEmail = async (user, order) => {
  const subject = `Your Order Has Been Delivered! - #${order.orderNumber}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #800020; margin-bottom: 10px;">Azra Nishat</h1>
        <h2 style="color: #444; margin-top: 0;">Order Delivered</h2>
      </div>

      <p>Dear ${user.firstName},</p>
      <p>Your order <strong>#${order.orderNumber}</strong> has been successfully delivered. We hope you are delighted with your purchase!</p>
      
      <div style="background-color: #f4faf4; border: 1px solid #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #155724;">Delivery Summary</h3>
        <p><strong>Delivered to:</strong><br>${formatAddress(order.shippingAddress)}</p>
        <p><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      <h3 style="color: #800020;">Order Summary</h3>
      ${renderOrderItems(order.items)}
      <p style="text-align: right; font-size: 16px;"><strong>Total Paid:</strong> PKR ${order.totalAmount.toLocaleString()}</p>

      <p style="margin-top: 30px;">If you love your items, we'd appreciate it if you could share your experience. If you have any concerns, please contact us immediately.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Azra Nishat. All rights reserved.</p>
        <p>Premium Jewelry, Cosmetics & Couture</p>
      </div>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html
  });
};

/**
 * Send general order status update email
 * @param {Object} user - User object
 * @param {Object} order - Order object
 */
const sendOrderStatusUpdateEmail = async (user, order) => {
  const subject = `Order Status Update - #${order.orderNumber}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #800020; margin-bottom: 10px;">Azra Nishat</h1>
        <h2 style="color: #444; margin-top: 0;">Order Update</h2>
      </div>

      <p>Dear ${user.firstName},</p>
      <p>The status of your order <strong>#${order.orderNumber}</strong> has been updated to <strong style="text-transform: uppercase;">${order.orderStatus}</strong>.</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #800020;">Current Order Status</h3>
        <p style="text-transform: capitalize; font-size: 18px;"><strong>${order.orderStatus}</strong></p>
      </div>

      <h3 style="color: #800020;">Order Details</h3>
      ${renderOrderItems(order.items)}
      <p style="text-align: right;"><strong>Total:</strong> PKR ${order.totalAmount.toLocaleString()}</p>

      <p style="margin-top: 30px;">You can view your full order details by logging into your account on our website.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Azra Nishat. All rights reserved.</p>
        <p>Premium Jewelry, Cosmetics & Couture</p>
      </div>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderStatusUpdateEmail
};

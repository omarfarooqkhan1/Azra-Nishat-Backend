const { sendEmail } = require('../utils/emailService');
const logger = require('../utils/logger');
const { AppError } = require('../errors');

/**
 * @desc    Submit contact form
 * @route   POST /api/v1/contact
 * @access  Public
 */
const submitContactForm = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return next(new AppError('Please provide all required fields', 400));
        }

        logger.info('Contact form submission', { name, email, subject });

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; color: #333;">
        <h2 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px;">New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h4 style="margin-top: 0; color: #800020;">Message:</h4>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `;

        await sendEmail({
            email: 'ofk079@gmail.com',
            subject: `Contact Form: ${subject}`,
            message: `New message from ${name} (${email}):\n\n${message}`,
            html
        });

        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully'
        });
    } catch (error) {
        logger.error('Contact form submission failed', error);
        return next(new AppError('Failed to send message. Please try again later.', 500));
    }
};

module.exports = {
    submitContactForm
};

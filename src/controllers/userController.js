const crypto = require('crypto');
const User = require('../models/User');
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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 required: true
 *               email:
 *                 type: string
 *                 required: true
 *               password:
 *                 type: string
 *                 required: true
 *               role:
 *                 type: string
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       400:
 *         description: Validation error
 */
// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    logger.info('User registration attempt', { email: req.body.email, ip: req.ip });

    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('User registration failed - email already exists', { email });
      return next(new ValidationError('Email already exists', [{ field: 'email', message: 'Email already exists' }]));
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'customer'
    });

    logger.info('User registered successfully', { userId: user._id, email });

    // Create token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          dateOfBirth: user.dateOfBirth,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      }
    });
  } catch (error) {
    logger.error('User registration failed', {
      error: error.message,
      email: req.body.email,
      stack: error.stack
    });

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ValidationError('Validation Error', errors));
    }

    return next(new AppError('Could not register user', 500));
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 required: true
 *               password:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    logger.info('User login attempt', { email: req.body.email, ip: req.ip });

    // If passport middleware was used, user is already authenticated and attached to req.user
    let user = req.user;

    // If no passport middleware, do manual authentication
    if (!user) {
      const { email, password } = req.body;

      // Validate email and password
      if (!email || !password) {
        logger.warn('User login failed - missing credentials', { email });
        return next(new ValidationError('Please provide an email and password'));
      }

      // Check for user
      user = await User.findOne({ email }).select('+password');
      if (!user) {
        logger.warn('User login failed - user not found', { email });
        return next(new UnauthorizedError('Invalid credentials'));
      }

      // Check if password matches
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        logger.warn('User login failed - invalid password', { email });
        return next(new UnauthorizedError('Invalid credentials'));
      }
    }

    logger.info('User login successful', { userId: user._id, email: user.email });

    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          dateOfBirth: user.dateOfBirth,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      }
    });
  } catch (error) {
    logger.error('User login failed', {
      error: error.message,
      email: req.body.email,
      stack: error.stack
    });

    return next(new AppError('Login failed', 500));
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    logger.info('Get current user profile', { userId: req.user.id });

    const user = await User.findById(req.user.id);

    if (!user) {
      logger.error('Current user not found', { userId: req.user.id });
      return next(new NotFoundError('User'));
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Get current user failed', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });

    return next(new AppError('Could not retrieve user', 500));
  }
};

/**
 * @swagger
 * /auth/updatedetails:
 *   put:
 *     summary: Update user details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User details updated
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
const updateDetails = async (req, res, next) => {
  try {
    logger.info('Update user details', { userId: req.user.id });

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    // Remove undefined values
    Object.keys(fieldsToUpdate).forEach(key =>
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    if (!user) {
      logger.error('User not found for update', { userId: req.user.id });
      return next(new NotFoundError('User'));
    }

    logger.info('User details updated successfully', { userId: user._id, email: user.email });

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Update user details failed', {
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

    return next(new AppError('Could not update user details', 500));
  }
};

/**
 * @swagger
 * /auth/updatepassword:
 *   put:
 *     summary: Update user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 required: true
 *               newPassword:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid current password
 */
// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    logger.info('Update user password attempt', { userId: req.user.id });

    const { currentPassword, newPassword } = req.body;

    // Get user from database
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      logger.error('User not found for password update', { userId: req.user.id });
      return next(new NotFoundError('User'));
    }

    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      logger.warn('Password update failed - current password incorrect', { userId: req.user.id });
      return next(new ValidationError('Current password is incorrect'));
    }

    user.password = newPassword;
    await user.save();

    logger.info('User password updated successfully', { userId: user._id });

    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    logger.error('Update password failed', {
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

    return next(new AppError('Could not update password', 500));
  }
};

/**
 * @swagger
 * /auth/forgotpassword:
 *   post:
 *     summary: Forgot password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    logger.info('Forgot password request', { email: req.body.email });

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      logger.warn('Forgot password - user not found', { email: req.body.email });
      return res.status(200).json({
        success: true,
        message: 'Email sent'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    logger.info('Password reset token generated', { userId: user._id, email: user.email });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    logger.info('OTP generated for password reset', { userId: user._id, email: user.email });
    console.log(`OTP for ${user.email}: ${otp}`); // Demo: log OTP instead of sending email

    res.status(200).json({
      success: true,
      data: { message: 'OTP sent to email' }
    });
  } catch (error) {
    logger.error('Forgot password request failed', {
      error: error.message,
      email: req.body.email,
      stack: error.stack
    });

    return next(new AppError('Could not process forgot password request', 500));
  }
};

/**
 * @swagger
 * /auth/resetpassword/{resettoken}:
 *   put:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: resettoken
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid token
 */
// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    logger.info('Password reset attempt', { resetToken: req.params.resettoken });

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn('Password reset failed - invalid or expired token', { resetToken: req.params.resettoken });
      return next(new ValidationError('Invalid token'));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.info('Password reset successful', { userId: user._id, email: user.email });

    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    logger.error('Password reset failed', {
      error: error.message,
      resetToken: req.params.resettoken,
      stack: error.stack
    });

    return next(new AppError('Could not reset password', 500));
  }
};

// @desc    Reset password with OTP
// @route   PUT /api/v1/auth/resetpassword-otp
// @access  Public
const resetPasswordWithOTP = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn('Reset password with OTP - user not found', { email });
      return next(new NotFoundError('User'));
    }

    if (user.otp !== otp || user.otpExpire < Date.now()) {
      logger.warn('Reset password with OTP - invalid or expired OTP', { email });
      return next(new ValidationError('Invalid or expired OTP'));
    }

    user.password = password;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    logger.info('Password reset with OTP successful', { userId: user._id, email });

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      data: { token }
    });
  } catch (error) {
    logger.error('Reset password with OTP failed', {
      error: error.message,
      email: req.body.email,
      stack: error.stack
    });

    return next(new AppError('Could not reset password', 500));
  }
};

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn('Verify OTP - user not found', { email });
      return next(new NotFoundError('User'));
    }

    if (user.otp !== otp || user.otpExpire < Date.now()) {
      logger.warn('Verify OTP - invalid or expired OTP', { email });
      return next(new ValidationError('Invalid or expired OTP'));
    }

    logger.info('OTP verified successfully', { userId: user._id, email });

    res.status(200).json({
      success: true,
      data: { message: 'OTP verified' }
    });
  } catch (error) {
    logger.error('Verify OTP failed', {
      error: error.message,
      email: req.body.email,
      stack: error.stack
    });

    return next(new AppError('Could not verify OTP', 500));
  }
};

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
// @desc    Logout user
// @route   GET /api/v1/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    logger.info('User logout', { userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout failed', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });

    return next(new AppError('Could not logout user', 500));
  }
};

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
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
 *         description: List of users
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin only
 */
// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    logger.info('Get all users request', { userId: req.user.id, role: req.user.role });

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      logger.warn('Get all users - unauthorized access', {
        userId: req.user.id,
        role: req.user.role
      });
      return next(new ForbiddenError());
    }

    // Parse pagination parameters
    const { page, limit, skip } = parsePaginationParams(req);

    // Parse sort parameters
    const sort = parseSortParams(req, ['name', 'email', 'role', 'createdAt', 'updatedAt']);

    // Parse filter parameters
    const allowedFilters = ['role', 'isActive', 'email'];
    const filters = parseFilterParams(req, allowedFilters);

    // Build query object
    let query = {};

    // Apply filters
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    if (req.query.email) {
      query.email = { $regex: req.query.email, $options: 'i' };
    }

    // Count total documents for pagination metadata
    const totalItems = await User.countDocuments(query);

    // Execute query with pagination and sorting
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Create pagination metadata
    const pagination = createPaginationMetadata(totalItems, page, limit);

    logger.info('Successfully retrieved users', {
      count: users.length,
      totalItems,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: {
        data: users,
        pagination
      }
    });
  } catch (error) {
    logger.error('Get all users failed', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });

    return next(new AppError('Could not retrieve users', 500));
  }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin only
 *       404:
 *         description: User not found
 */
// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    logger.info('Get user by ID request', {
      userId: req.params.id,
      requesterId: req.user.id,
      role: req.user.role
    });

    if (req.user.role !== 'admin') {
      logger.warn('Get user by ID - unauthorized access', {
        userId: req.params.id,
        requesterId: req.user.id,
        role: req.user.role
      });
      return next(new ForbiddenError());
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      logger.warn('Get user by ID - user not found', { userId: req.params.id });
      return next(new NotFoundError('User'));
    }

    logger.info('Successfully retrieved user by ID', {
      userId: user._id,
      requesterId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user by ID failed', {
      error: error.message,
      userId: req.params.id,
      requesterId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid user ID'));
    }

    return next(new AppError('Could not retrieve user', 500));
  }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin only
 *       404:
 *         description: User not found
 */
// @desc    Update user by ID
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
const updateUserById = async (req, res, next) => {
  try {
    logger.info('Update user by ID request', {
      userId: req.params.id,
      requesterId: req.user.id,
      role: req.user.role
    });

    if (req.user.role !== 'admin') {
      logger.warn('Update user by ID - unauthorized access', {
        userId: req.params.id,
        requesterId: req.user.id,
        role: req.user.role
      });
      return next(new ForbiddenError());
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      logger.warn('Update user by ID - user not found', { userId: req.params.id });
      return next(new NotFoundError('User'));
    }

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role
    };

    // Remove undefined values
    Object.keys(fieldsToUpdate).forEach(key =>
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    logger.info('User updated by ID successfully', {
      userId: updatedUser._id,
      requesterId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    logger.error('Update user by ID failed', {
      error: error.message,
      userId: req.params.id,
      requesterId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid user ID'));
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ValidationError('Validation Error', errors));
    }

    return next(new AppError('Could not update user', 500));
  }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
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
 *         description: User deleted
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
 *         description: User not found
 */
// @desc    Delete user by ID
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    logger.info('Delete user by ID request', {
      userId: req.params.id,
      requesterId: req.user.id,
      role: req.user.role
    });

    if (req.user.role !== 'admin') {
      logger.warn('Delete user by ID - unauthorized access', {
        userId: req.params.id,
        requesterId: req.user.id,
        role: req.user.role
      });
      return next(new ForbiddenError());
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      logger.warn('Delete user by ID - user not found', { userId: req.params.id });
      return next(new NotFoundError('User'));
    }

    // Check if user is admin and trying to delete themselves
    if (user._id.toString() === req.user.id && user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        logger.warn('Delete user by ID failed - last admin', { userId: req.params.id });
        return next(new ValidationError('Cannot delete the last admin'));
      }
    }

    await user.remove();

    logger.info('User deleted by ID successfully', {
      userId: user._id,
      requesterId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Delete user by ID failed', {
      error: error.message,
      userId: req.params.id,
      requesterId: req.user.id,
      stack: error.stack
    });

    if (error.name === 'CastError') {
      return next(new ValidationError('Invalid user ID'));
    }

    return next(new AppError('Could not delete user', 500));
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  resetPasswordWithOTP,
  verifyOTP,
  logout,
  getUsers,
  getUserById,
  updateUserById,
  deleteUser
};
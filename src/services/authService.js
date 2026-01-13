const User = require('../models/User');
const crypto = require('crypto');
const logger = require('../utils/logger');

const registerUser = async (userData) => {
  try {
    logger.info('Registering user in service', { email: userData.email });

    const { name, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('User registration failed - email already exists in service', { email });
      throw new Error('Email already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    logger.info('User registered successfully in service', { 
      userId: user._id, 
      email 
    });

    return user;
  } catch (error) {
    logger.error('User registration failed in service', {
      error: error.message,
      email: userData.email,
      stack: error.stack
    });
    throw error;
  }
};

const loginUser = async (email, password) => {
  try {
    logger.info('User login attempt in service', { email });

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('User login failed - user not found in service', { email });
      throw new Error('Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logger.warn('User login failed - invalid password in service', { email });
      throw new Error('Invalid credentials');
    }

    logger.info('User login successful in service', { userId: user._id, email });

    return user;
  } catch (error) {
    logger.error('User login failed in service', {
      error: error.message,
      email,
      stack: error.stack
    });
    throw error;
  }
};

const getUserProfile = async (userId) => {
  try {
    logger.info('Getting user profile in service', { userId });

    const user = await User.findById(userId);

    if (!user) {
      logger.warn('User not found in service', { userId });
      return null;
    }

    logger.info('User profile retrieved successfully in service', { userId });

    return user;
  } catch (error) {
    logger.error('Get user profile failed in service', {
      error: error.message,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

const updateUserProfile = async (userId, updateData) => {
  try {
    logger.info('Updating user profile in service', { userId });

    const fieldsToUpdate = {
      name: updateData.name,
      email: updateData.email
    };

    // Remove undefined values
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(userId, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    if (!user) {
      logger.warn('User not found for update in service', { userId });
      return null;
    }

    logger.info('User profile updated successfully in service', { 
      userId: user._id, 
      email: user.email 
    });

    return user;
  } catch (error) {
    logger.error('Update user profile failed in service', {
      error: error.message,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

const updatePassword = async (userId, currentPassword, newPassword) => {
  try {
    logger.info('Updating user password in service', { userId });

    // Get user from database
    const user = await User.findById(userId).select('+password');

    if (!user) {
      logger.warn('User not found for password update in service', { userId });
      return null;
    }

    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      logger.warn('Password update failed - current password incorrect in service', { userId });
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    logger.info('User password updated successfully in service', { userId: user._id });

    return user;
  } catch (error) {
    logger.error('Update password failed in service', {
      error: error.message,
      userId,
      stack: error.stack
    });
    throw error;
  }
};

const forgotPassword = async (email) => {
  try {
    logger.info('Forgot password request in service', { email });

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn('Forgot password - user not found in service', { email });
      return { success: true, message: 'Email sent' };
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    logger.info('Password reset token generated in service', { 
      userId: user._id, 
      email: user.email 
    });

    // In a real app, you would send an email here
    // For now, just return success
    return { success: true, message: 'Email sent' };
  } catch (error) {
    logger.error('Forgot password request failed in service', {
      error: error.message,
      email,
      stack: error.stack
    });
    throw error;
  }
};

const resetPassword = async (resetToken, newPassword) => {
  try {
    logger.info('Password reset attempt in service');

    // Get hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn('Password reset failed - invalid or expired token in service');
      throw new Error('Invalid token');
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.info('Password reset successful in service', { userId: user._id, email: user.email });

    return user;
  } catch (error) {
    logger.error('Password reset failed in service', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updatePassword,
  forgotPassword,
  resetPassword
};
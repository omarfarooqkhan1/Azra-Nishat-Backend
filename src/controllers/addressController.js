const Address = require('../models/Address');
const { AppError, NotFoundError, ValidationError } = require('../errors');
const logger = require('../utils/logger');

// @desc    Get all addresses for logged in user
// @route   GET /api/v1/addresses
// @access  Private
const getAddresses = async (req, res, next) => {
    try {
        const addresses = await Address.find({ user: req.user.id });
        res.status(200).json({
            success: true,
            data: addresses
        });
    } catch (error) {
        next(new AppError('Could not retrieve addresses', 500));
    }
};

// @desc    Get single address
// @route   GET /api/v1/addresses/:id
// @access  Private
const getAddress = async (req, res, next) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
        if (!address) {
            return next(new NotFoundError('Address'));
        }
        res.status(200).json({
            success: true,
            data: address
        });
    } catch (error) {
        next(new AppError('Could not retrieve address', 500));
    }
};

// @desc    Create new address
// @route   POST /api/v1/addresses
// @access  Private
const createAddress = async (req, res, next) => {
    try {
        req.body.user = req.user.id;

        // If this is set as default, unset other defaults
        if (req.body.isDefault) {
            await Address.updateMany({ user: req.user.id }, { isDefault: false });
        }

        const address = await Address.create(req.body);

        res.status(201).json({
            success: true,
            data: address
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new ValidationError(messages.join(', ')));
        }
        next(new AppError('Could not create address', 500));
    }
};

// @desc    Update address
// @route   PUT /api/v1/addresses/:id
// @access  Private
const updateAddress = async (req, res, next) => {
    try {
        let address = await Address.findOne({ _id: req.params.id, user: req.user.id });

        if (!address) {
            return next(new NotFoundError('Address'));
        }

        // If setting as default, unset other defaults
        if (req.body.isDefault) {
            await Address.updateMany({ user: req.user.id }, { isDefault: false });
        }

        address = await Address.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: address
        });
    } catch (error) {
        next(new AppError('Could not update address', 500));
    }
};

// @desc    Delete address
// @route   DELETE /api/v1/addresses/:id
// @access  Private
const deleteAddress = async (req, res, next) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user.id });

        if (!address) {
            return next(new NotFoundError('Address'));
        }

        await address.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(new AppError('Could not delete address', 500));
    }
};

// @desc    Set default address
// @route   PATCH /api/v1/addresses/:id/default
// @access  Private
const setDefaultAddress = async (req, res, next) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user.id });

        if (!address) {
            return next(new NotFoundError('Address'));
        }

        await Address.updateMany({ user: req.user.id }, { isDefault: false });

        address.isDefault = true;
        await address.save();

        res.status(200).json({
            success: true,
            data: address
        });
    } catch (error) {
        next(new AppError('Could not set default address', 500));
    }
};

module.exports = {
    getAddresses,
    getAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        default: 'Default'
    },
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
        default: 'Pakistan'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['shipping', 'billing', 'both'],
        default: 'shipping'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Address', addressSchema);

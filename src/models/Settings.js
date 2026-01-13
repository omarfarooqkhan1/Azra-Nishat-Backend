const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        required: true,
        default: 'Azra Nishat'
    },
    siteDescription: {
        type: String,
        default: 'Premium jewelry, cosmetics & couture'
    },
    contactEmail: {
        type: String,
        default: 'contact@azranishat.com'
    },
    contactPhone: {
        type: String,
        default: '+92-300-1234567'
    },
    address: {
        type: String,
        default: '123 Fashion Street, Karachi, Pakistan'
    },
    currency: {
        type: String,
        default: 'PKR'
    },
    timezone: {
        type: String,
        default: 'Asia/Karachi'
    },
    logo: {
        type: String
    },
    favicon: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    expiryDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: 1
    },
    usedCount: {
        type: Number,
        default: 0
    },
    usedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    }
}, { timestamps: true });

// Check if coupon is valid for a specific user
couponSchema.methods.isValid = function (userId) {
    if (!this.isActive) return false;
    if (this.expiryDate < new Date()) return false;
    if (this.usedCount >= this.usageLimit) return false;
    if (userId && this.usedBy.includes(userId)) return false;
    return true;
};

module.exports = mongoose.model('Coupon', couponSchema);

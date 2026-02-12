const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        refundAmount: {
            type: Number,
            required: true
        },
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'warehouse',
            required: true
        }
    }],
    totalRefundAmount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ''
    },
    // Multi-tenant field
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    }
}, { timestamps: true });

// Indexes for efficient queries
refundSchema.index({ organizationId: 1, customerId: 1, createdAt: -1 });
refundSchema.index({ organizationId: 1, orderId: 1 });

const Refund = mongoose.model('Refund', refundSchema);

module.exports = Refund;

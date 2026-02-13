const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
        price: {
            type: Number,
            required: true
        },
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'warehouse',
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    originalAmount: {
        type: Number
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    couponCode: {
        type: String,
        default: null
    },

    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    billingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'paypal', 'cash_on_delivery'],
        default: 'cash_on_delivery'
    },
    trackingNumber: {
        type: String,
        default: null
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
orderSchema.index({ organizationId: 1, customerId: 1, createdAt: -1 });
orderSchema.index({ organizationId: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

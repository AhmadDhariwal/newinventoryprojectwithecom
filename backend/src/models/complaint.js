const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order Reference is required']
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-review', 'resolved', 'dismissed'],
        default: 'pending'
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    category: {
        type: String,
        enum: ['delivery', 'product_quality', 'wrong_item', 'other'],
        default: 'other'
    },
    resolution: {
        type: String,
        default: ''
    }
}, { timestamps: true });

complaintSchema.index({ organizationId: 1, customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);

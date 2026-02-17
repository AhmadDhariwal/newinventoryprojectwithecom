const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Can also be Customer, but we store the ID
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['customer', 'admin', 'manager', 'organization_user']
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: false
    },
    intent: {
        type: String,
        required: true
    },
    query: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    success: {
        type: Boolean,
        default: true
    },
    error: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for quick retrieval of history if needed later
chatLogSchema.index({ userId: 1, createdAt: -1 });
chatLogSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatLog', chatLogSchema);

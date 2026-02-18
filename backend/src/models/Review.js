const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  guestName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  guestEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  comment: {
    type: String,
    required: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  helpfulCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, rating: 1 });
reviewSchema.index({ organizationId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true, sparse: true });

// Validation: Either userId OR (guestName + guestEmail) must be present
reviewSchema.pre('validate', async function () {
  if (!this.userId && (!this.guestName || !this.guestEmail)) {
    throw new Error('Either userId or guest information (name and email) is required');
  } else if (this.userId && (this.guestName || this.guestEmail)) {
    this.guestName = undefined;
    this.guestEmail = undefined;
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

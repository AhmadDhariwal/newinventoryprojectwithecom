const Review = require('../models/Review');
const Product = require('../models/product');
const Order = require('../models/order');
const mongoose = require('mongoose');

// Submit a new review
exports.submitReview = async (reviewData, user) => {
  const { productId, rating, comment, guestName, guestEmail, organizationId } = reviewData;

  // Check if user already reviewed this product
  if (user) {
    const existingReview = await Review.findOne({ productId, userId: user._id });
    if (existingReview) {
      throw new Error('You have already reviewed this product');
    }
  }

  // Check if verified purchase
  let isVerifiedPurchase = false;
  if (user) {
    const order = await Order.findOne({
      customerId: user._id,
      'items.product': productId,
      status: { $in: ['delivered', 'completed'] }
    });
    isVerifiedPurchase = !!order;
  }

  // Create review
  const review = new Review({
    productId,
    userId: user ? user._id : null,
    guestName: user ? undefined : guestName,
    guestEmail: user ? undefined : guestEmail,
    rating,
    comment,
    organizationId,
    isVerifiedPurchase
  });

  await review.save();

  // Update product rating stats
  await module.exports.updateProductRatings(productId);

  return review;
};

// Update product rating aggregations
exports.updateProductRatings = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), isApproved: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        five: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        four: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        three: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        two: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        one: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      }
    }
  ]);

  if (stats.length > 0) {
    const { averageRating, totalReviews, five, four, three, two, one } = stats[0];
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingBreakdown: { five, four, three, two, one }
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 }
    });
  }
};

// Get reviews for a product
exports.getProductReviews = async (productId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    rating = null,
    sort = 'newest'
  } = options;

  const filter = {
    productId: new mongoose.Types.ObjectId(productId),
    isApproved: true
  };

  if (rating) {
    filter.rating = parseInt(rating);
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
  if (sort === 'lowest') sortOption = { rating: 1, createdAt: -1 };

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('userId', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter)
  ]);

  return {
    reviews: reviews.map(r => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      reviewerName: r.userId ? r.userId.name : r.guestName,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt,
      helpfulCount: r.helpfulCount
    })),
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
};

// Get review summary for a product
exports.getReviewSummary = async (productId) => {
  const product = await Product.findById(productId)
    .select('averageRating totalReviews ratingBreakdown')
    .lean();

  if (!product) {
    throw new Error('Product not found');
  }

  return {
    averageRating: product.averageRating || 0,
    totalReviews: product.totalReviews || 0,
    ratingBreakdown: product.ratingBreakdown || { five: 0, four: 0, three: 0, two: 0, one: 0 }
  };
};

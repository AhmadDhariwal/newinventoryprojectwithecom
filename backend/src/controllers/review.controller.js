const reviewService = require('../services/review.service');
const { body, validationResult, query } = require('express-validator');

// Validation rules
exports.submitReviewValidation = [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters')
    .escape(),
  body('guestName')
    .if(body('userId').not().exists())
    .trim()
    .notEmpty()
    .withMessage('Guest name is required')
    .isLength({ max: 100 })
    .escape(),
  body('guestEmail')
    .if(body('userId').not().exists())
    .trim()
    .notEmpty()
    .withMessage('Guest email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
];

// Submit review
exports.submitReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const reviewData = {
      ...req.body,
      organizationId: req.organizationId || req.body.organizationId
    };

    const review = await reviewService.submitReview(reviewData, req.user || req.customer);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get product reviews
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page, limit, rating, sort } = req.query;

    const result = await reviewService.getProductReviews(productId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      rating,
      sort
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get review summary
exports.getReviewSummary = async (req, res) => {
  try {
    const { productId } = req.params;
    const summary = await reviewService.getReviewSummary(productId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

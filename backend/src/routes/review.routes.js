const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

// Submit review (logged in or guest)
router.post(
  '/',
  optionalAuth,
  reviewController.submitReviewValidation,
  reviewController.submitReview
);

// Get reviews for a product
router.get('/product/:productId', reviewController.getProductReviews);

// Get review summary for a product
router.get('/product/:productId/summary', reviewController.getReviewSummary);

module.exports = router;

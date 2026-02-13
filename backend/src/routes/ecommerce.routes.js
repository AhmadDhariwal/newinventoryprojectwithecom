const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerce.controller');
const complaintController = require('../controllers/complaint.controller');
const { verifyCustomerToken, optionalCustomerAuth } = require('../middleware/auth.middleware');

// Public routes (no authentication required)
router.post('/auth/register', ecommerceController.register);
router.post('/auth/login', ecommerceController.login);
router.get('/products', ecommerceController.getProducts);
router.get('/products/:id', ecommerceController.getProductById);
router.get('/categories', ecommerceController.getCategories);
router.post('/contact', ecommerceController.submitContact);
router.post('/validate-coupon', optionalCustomerAuth, ecommerceController.checkCoupon);

// Protected routes (customer authentication required)

router.post('/orders', optionalCustomerAuth, ecommerceController.createOrder);
router.get('/orders', verifyCustomerToken, ecommerceController.getOrders);

router.get('/orders/:id', verifyCustomerToken, ecommerceController.getOrderById);
router.post('/refunds', verifyCustomerToken, ecommerceController.requestRefund);
router.get('/profile', verifyCustomerToken, ecommerceController.getProfile);
router.put('/profile', verifyCustomerToken, ecommerceController.updateProfile);
router.post('/complaint', optionalCustomerAuth, complaintController.createComplaint);


module.exports = router;

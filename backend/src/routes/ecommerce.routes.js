const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerce.controller');
const { verifyCustomerToken } = require('../middleware/auth.middleware');

// Public routes (no authentication required)
router.post('/auth/register', ecommerceController.register);
router.post('/auth/login', ecommerceController.login);
router.get('/products', ecommerceController.getProducts);
router.get('/products/:id', ecommerceController.getProductById);

// Protected routes (customer authentication required)
router.post('/orders', verifyCustomerToken, ecommerceController.createOrder);
router.get('/orders', verifyCustomerToken, ecommerceController.getOrders);
router.get('/orders/:id', verifyCustomerToken, ecommerceController.getOrderById);
router.post('/refunds', verifyCustomerToken, ecommerceController.requestRefund);
router.get('/profile', verifyCustomerToken, ecommerceController.getProfile);
router.put('/profile', verifyCustomerToken, ecommerceController.updateProfile);

module.exports = router;

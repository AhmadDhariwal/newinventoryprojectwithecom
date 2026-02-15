const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/chatbot.controller');
const { verifytoken } = require('../middleware/auth.middleware');
const { verifyCustomerToken } = require('../middleware/auth.middleware');

// Customer Chat Endpoint (For E-commerce Store)
router.post('/customer', verifyCustomerToken, ChatbotController.customerChat);

// Internal Chat Endpoint (For Inventory Dashboard)
router.post('/internal', verifytoken, ChatbotController.internalChat);

module.exports = router;

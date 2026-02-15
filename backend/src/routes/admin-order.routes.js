const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/admin-order.controller');
const { verifytoken, restrictto } = require('../middleware/auth.middleware');

// Routes for Admin/Manager
// GET /api/admin/orders
router.get('/orders', verifytoken, restrictto(['admin', 'manager']), adminOrderController.getAllOrders);

// GET /api/admin/orders/:id
router.get('/orders/:id', verifytoken, restrictto(['admin', 'manager']), adminOrderController.getOrderById);

// PUT /api/admin/orders/:id
router.put('/orders/:id', verifytoken, restrictto(['admin', 'manager']), adminOrderController.updateOrderStatus);

module.exports = router;

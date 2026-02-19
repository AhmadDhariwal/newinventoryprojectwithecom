const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifytoken } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(verifytoken);

// Product CRUD routes
router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Stock management routes
router.put('/:id/stock', productController.updateProductStock);

module.exports = router;
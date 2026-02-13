const express = require("express");
const router = express.Router();
const product = require("../models/product");
const Category = require("../models/category");
const User = require("../models/user");
const { verifytoken, restrictto } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const path = require('path');
const fs = require('fs');

// GET all products - Role-based filtering
router.get("/", verifytoken, async (req, res) => {
  try {
    // Build role-based filter
    const filter = { organizationId: req.organizationId };

    if (req.user.role !== 'admin') {
      // Get assigned users for managers
      let assignedUsers = [];
      if (req.user.role === 'manager') {
        const userDoc = await User.findById(req.user.userid);
        assignedUsers = userDoc?.assignedUsers || [];
      }

      // Filter by creator
      const userIds = req.user.role === 'manager'
        ? [req.user.userid, ...assignedUsers]
        : [req.user.userid];
      filter.createdBy = { $in: userIds };
    }

    const products = await product.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    console.log(`Products (${req.user.role}): ${products.length} products`);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single product - Role-based access control
router.get("/:id", verifytoken, async (req, res) => {
  try {
    const filter = { _id: req.params.id, organizationId: req.organizationId };

    // Non-admins can only view their own or assigned users' products
    if (req.user.role !== 'admin') {
      let assignedUsers = [];
      if (req.user.role === 'manager') {
        const userDoc = await User.findById(req.user.userid);
        assignedUsers = userDoc?.assignedUsers || [];
      }

      const userIds = req.user.role === 'manager'
        ? [req.user.userid, ...assignedUsers]
        : [req.user.userid];
      filter.createdBy = { $in: userIds };
    }

    const productData = await product.findOne(filter)
      .populate('category', 'name');

    if (!productData) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }
    res.json(productData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE product - Allow admin, manager, and user
router.post("/", verifytoken, restrictto(['admin', 'manager', 'user']), upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];
    
    const productData = {
      ...req.body,
      images,
      organizationId: req.organizationId,
      createdBy: req.userid
    };

    // Check for duplicate SKU in organization
    const existingProduct = await product.findOne({ sku: req.body.sku, organizationId: req.organizationId });
    if (existingProduct) {
      return res.status(400).json({ error: 'Product with this SKU already exists in your organization' });
    }

    const newProduct = new product(productData);
    await newProduct.save();
    const populatedProduct = await product.findById(newProduct._id).populate('category', 'name');
    res.status(201).json(populatedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE product - Allow admin, manager, and user
router.put("/:id", verifytoken, restrictto(['admin', 'manager', 'user']), upload.array('images', 5), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
      updateData.images = req.body.existingImages ? 
        [...JSON.parse(req.body.existingImages), ...newImages] : 
        newImages;
    }
    
    const updatedProduct = await product.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE product - Admin and Manager only (Users should not delete)
router.delete("/:id", verifytoken, restrictto(['admin', 'manager']), async (req, res) => {
  try {
    const deletedProduct = await product.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

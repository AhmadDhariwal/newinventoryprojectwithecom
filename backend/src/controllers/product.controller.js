const Product = require('../models/product');
const StockLevel = require('../models/stocklevel');
const Warehouse = require('../models/warehouse');
const activityLogService = require('../services/activitylog.service');
const mongoose = require('mongoose');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, sku, description, category, cost, price, discountPrice, discountPercentage, reorderLevel, images, status } = req.body;
    
    if (!name || !sku || !cost || !price) {
      return res.status(400).json({ success: false, message: 'Name, SKU, cost, and price are required' });
    }

    const product = new Product({
      name,
      sku,
      description,
      category,
      cost,
      price,
      discountPrice,
      discountPercentage,
      reorderLevel: reorderLevel || 0,
      reservedQuantity: 0, // Always start with 0 reserved
      images: images || [],
      status: status || 'active',
      organizationId: req.organizationId,
      createdBy: req.userid
    });

    await product.save();

    // Log activity
    await activityLogService.logActivity({
      userId: req.userid,
      action: 'CREATE',
      module: 'Product',
      entityId: product._id,
      entityName: product.name,
      description: `Created product: ${product.name} (${product.sku})`,
      ip: req.ip,
      organizationId: req.organizationId
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'SKU already exists in this organization' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
    
    const filter = { organizationId: req.organizationId };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) filter.category = category;
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    console.log(`Found ${products.length} products for organization ${req.organizationId}`);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get product by ID with stock levels
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      organizationId: req.organizationId 
    })
    .populate('category', 'name')
    .populate('createdBy', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get stock levels for this product
    const stockLevels = await StockLevel.find({ 
      product: product._id, 
      organizationId: req.organizationId 
    })
    .populate('warehouse', 'name location');

    // Calculate total available and reserved quantities
    const totalAvailable = stockLevels.reduce((sum, stock) => sum + stock.quantity, 0);
    const totalReserved = stockLevels.reduce((sum, stock) => sum + stock.reservedQuantity, 0);

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        stockLevels,
        totalAvailable,
        totalReserved
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { reorderLevel, reservedQuantity, ...updateData } = req.body;
    
    const product = await Product.findOne({ 
      _id: req.params.id, 
      organizationId: req.organizationId 
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update product fields
    Object.assign(product, updateData);
    
    if (reorderLevel !== undefined) {
      product.reorderLevel = reorderLevel;
    }
    
    if (reservedQuantity !== undefined) {
      product.reservedQuantity = reservedQuantity;
    }

    await product.save();

    // Log activity
    await activityLogService.logActivity({
      userId: req.userid,
      action: 'UPDATE',
      module: 'Product',
      entityId: product._id,
      entityName: product.name,
      description: `Updated product: ${product.name} (${product.sku})`,
      ip: req.ip,
      organizationId: req.organizationId
    });

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'SKU already exists in this organization' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      organizationId: req.organizationId 
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if product has stock
    const stockLevels = await StockLevel.find({ 
      product: product._id, 
      organizationId: req.organizationId 
    });

    const hasStock = stockLevels.some(stock => stock.quantity > 0);
    if (hasStock) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete product with existing stock. Remove all stock first.' 
      });
    }

    // Delete associated stock levels
    await StockLevel.deleteMany({ 
      product: product._id, 
      organizationId: req.organizationId 
    });

    await Product.findByIdAndDelete(product._id);

    // Log activity
    await activityLogService.logActivity({
      userId: req.userid,
      action: 'DELETE',
      module: 'Product',
      entityId: product._id,
      entityName: product.name,
      description: `Deleted product: ${product.name} (${product.sku})`,
      ip: req.ip,
      organizationId: req.organizationId
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product stock levels (reorder level and reserved quantity)
exports.updateProductStock = async (req, res) => {
  try {
    const { reorderLevel, reservedQuantity } = req.body;
    
    const product = await Product.findOne({ 
      _id: req.params.id, 
      organizationId: req.organizationId 
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (reorderLevel !== undefined) {
      product.reorderLevel = Math.max(0, reorderLevel);
    }
    
    if (reservedQuantity !== undefined) {
      product.reservedQuantity = Math.max(0, reservedQuantity);
    }

    await product.save();

    // Log activity
    await activityLogService.logActivity({
      userId: req.userid,
      action: 'UPDATE',
      module: 'Product',
      entityId: product._id,
      entityName: product.name,
      description: `Updated stock settings for product: ${product.name}`,
      ip: req.ip,
      organizationId: req.organizationId
    });

    res.json({
      success: true,
      data: product,
      message: 'Product stock settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
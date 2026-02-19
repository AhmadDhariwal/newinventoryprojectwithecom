const StockLevel = require('../models/stocklevel');
const Product = require('../models/product');
const Warehouse = require('../models/warehouse');
const socketUtils = require('../utils/socket');
const notificationService = require('./notification.service');

/**
 * Initialize stock levels for all products in all warehouses for a specific organization
 * Only creates stock levels with 0 quantity - no random values
 */
const initializeStockLevels = async (organizationId) => {
  try {
    const query = organizationId ? { organizationId } : {};

    const products = await Product.find(query);
    const warehouses = await Warehouse.find({ ...query, isActive: true });

    if (products.length === 0 || warehouses.length === 0) {
      console.log('No products or warehouses found to initialize stock levels');
      return { message: 'No products or warehouses found' };
    }

    let created = 0;
    let existing = 0;

    for (const product of products) {
      for (const warehouse of warehouses) {
        const stockQuery = {
          product: product._id,
          warehouse: warehouse._id
        };

        if (organizationId) {
          stockQuery.organizationId = organizationId;
        }

        const existingStock = await StockLevel.findOne(stockQuery);

        if (!existingStock) {
          const newStock = {
            product: product._id,
            warehouse: warehouse._id,
            quantity: 0, // Always start with 0
            reservedQuantity: 0,
            reorderLevel: 0, // User should set this manually
            minStock: 0 // User should set this manually
          };

          if (organizationId) {
            newStock.organizationId = organizationId;
          }

          await StockLevel.create(newStock);
          created++;
        } else {
          existing++;
        }
      }
    }

    return {
      message: `Stock levels initialized: ${created} created, ${existing} already existed`,
      created,
      existing
    };
  } catch (error) {
    console.error('Error initializing stock levels:', error);
    throw error;
  }
};

/**
 * Get or create stock level for a specific product-warehouse combination
 */
const getOrCreateStockLevel = async (productId, warehouseId, organizationId) => {
  try {
    let query = {
      product: productId,
      warehouse: warehouseId
    };

    if (organizationId) {
      query.organizationId = organizationId;
    }

    let stockLevel = await StockLevel.findOne(query)
      .populate('product', 'name sku')
      .populate('warehouse', 'name');

    if (!stockLevel) {
      const newStock = {
        product: productId,
        warehouse: warehouseId,
        quantity: 0, // Always start with 0 quantity
        reservedQuantity: 0,
        reorderLevel: 0, // Start with 0, user can set manually
        minStock: 0 // Start with 0, user can set manually
      };

      if (organizationId) {
        newStock.organizationId = organizationId;
      }

      stockLevel = await StockLevel.create(newStock);

      stockLevel = await StockLevel.findById(stockLevel._id)
        .populate('product', 'name sku')
        .populate('warehouse', 'name');
    }

    return stockLevel;
  } catch (error) {
    console.error('Error getting or creating stock level:', error);
    throw error;
  }
};

/**
 * Update stock quantity for a specific product-warehouse combination
 */
const updateStockQuantity = async (productId, warehouseId, organizationId, quantityDelta) => {
  try {
    const stockLevel = await getOrCreateStockLevel(productId, warehouseId, organizationId);
    const oldQuantity = stockLevel.quantity;
    stockLevel.quantity += quantityDelta;

    if (stockLevel.quantity < 0) stockLevel.quantity = 0;

    await stockLevel.save();

    // Trigger notification if stock drops below reorder level
    if (stockLevel.quantity <= stockLevel.reorderLevel && (oldQuantity > stockLevel.reorderLevel || (quantityDelta < 0 && oldQuantity <= stockLevel.reorderLevel))) {
      const productName = stockLevel.product ? stockLevel.product.name : 'Unknown Product';
      const warehouseName = stockLevel.warehouse ? stockLevel.warehouse.name : 'Unknown Warehouse';

      notificationService.notifyOrganizationRole(
        organizationId,
        'admin',
        'LOW_STOCK',
        `Low Stock: ${productName}`,
        `${productName} in ${warehouseName} is at ${stockLevel.quantity}.`,
        {
          productId: productId,
          warehouseId: warehouseId,
          currentQuantity: stockLevel.quantity,
          reorderLevel: stockLevel.reorderLevel
        }
      );

      notificationService.notifyOrganizationRole(
        organizationId,
        'manager',
        'LOW_STOCK',
        `Low Stock: ${productName}`,
        `${productName} in ${warehouseName} is at ${stockLevel.quantity}.`,
        {
          productId: productId,
          warehouseId: warehouseId,
          currentQuantity: stockLevel.quantity,
          reorderLevel: stockLevel.reorderLevel
        }
      );
    }

    return stockLevel;
  } catch (error) {
    console.error('Error updating stock quantity:', error);
    throw error;
  }
};

module.exports = {
  initializeStockLevels,
  getOrCreateStockLevel,
  updateStockQuantity
};
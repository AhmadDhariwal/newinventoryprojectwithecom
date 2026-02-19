const Product = require('../models/product');
const Supplier = require('../models/supplier');
const PurchaseOrder = require('../models/purchaseorder');
const SalesOrder = require('../models/salesorder');
const StockMovement = require('../models/stockmovement');
const StockLevel = require('../models/stocklevel');
const User = require('../models/user');
const mongoose = require('mongoose');
const Order = require('../models/order');

const getAccessibleUserIds = async (role, userId) => {
  if (role === 'admin') {
    return null;
  }

  if (role === 'manager') {
    const user = await User.findById(userId).select('assignedUsers');
    const assignedUsers = user?.assignedUsers || [];
    return [userId, ...assignedUsers.map(id => id.toString())];
  }

  return [userId];
};

const buildFilter = (organizationId, role, userIds, fieldName = 'createdBy') => {
  const filter = { organizationId: new mongoose.Types.ObjectId(organizationId) };

  if (role !== 'admin' && userIds) {
    filter[fieldName] = { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) };
  }

  return filter;
};

exports.getDashboardSummary = async (user, organizationId) => {
  try {
    const userIds = await getAccessibleUserIds(user.role, user.userid);

    const productFilter = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    const supplierFilter = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    const purchaseFilter = buildFilter(organizationId, user.role, userIds, 'createdBy');
    const movementFilter = buildFilter(organizationId, user.role, userIds, 'user');
    const stockFilter = { organizationId: new mongoose.Types.ObjectId(organizationId) };

    const [
      totalProducts,
      totalSuppliers,
      purchaseStats,
      stockQty,
      lowStockItems,
      stockInToday,
      stockOutToday,
      pendingPurchases,
      approvedPurchases,
      recentApprovedPurchases,
      salesStats,
      internalSalesStats
    ] = await Promise.all([
      Product.countDocuments(productFilter),
      Supplier.countDocuments(supplierFilter),

      PurchaseOrder.aggregate([
        { $match: purchaseFilter },
        {
          $group: {
            _id: "$status",
            total: { $sum: "$totalamount" },
            count: { $sum: 1 }
          }
        }
      ]),

      StockLevel.aggregate([
        { $match: stockFilter },
        { $group: { _id: null, qty: { $sum: "$quantity" } } }
      ]),

      StockLevel.aggregate([
        { $match: stockFilter },
        { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productInfo' } },
        { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'warehouseInfo' } },
        { $match: { $expr: { $and: [{ $gt: ["$minStock", 0] }, { $lte: ["$quantity", "$minStock"] }] } } },
        {
          $project: {
            productId: "$product",
            productName: { $arrayElemAt: ["$productInfo.name", 0] },
            sku: { $arrayElemAt: ["$productInfo.sku", 0] },
            warehouseName: { $arrayElemAt: ["$warehouseInfo.name", 0] },
            availableQty: "$quantity",
            minStock: "$minStock"
          }
        }
      ]),

      StockMovement.aggregate([
        {
          $match: {
            ...movementFilter,
            type: 'IN',
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          }
        },
        { $group: { _id: null, qty: { $sum: '$quantity' } } }
      ]),

      StockMovement.aggregate([
        {
          $match: {
            ...movementFilter,
            type: 'OUT',
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          }
        },
        { $group: { _id: null, qty: { $sum: '$quantity' } } }
      ]),

      PurchaseOrder.countDocuments({ ...purchaseFilter, status: 'PENDING' }),
      PurchaseOrder.countDocuments({ ...purchaseFilter, status: 'RECEIVED' }),

      PurchaseOrder.find({ ...purchaseFilter, status: 'RECEIVED' })
        .sort({ approvedAt: -1 })
        .limit(5)
        .populate('supplier', 'name')
        .populate('createdBy', 'name')
        .lean(),

      // New: E-commerce Sales (Order model)
      Order.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),

      // New: Internal Sales (SalesOrder model)
      SalesOrder.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: null, total: { $sum: "$totalamount" } } }
      ])
    ]);

    const approvedAmount = purchaseStats.find(s => s._id === 'APPROVED')?.total || 0;
    const pendingAmount = purchaseStats.find(s => s._id === 'PENDING')?.total || 0;
    const receivedAmount = purchaseStats.find(s => s._id === 'RECEIVED')?.total || 0;

    const ecomSales = salesStats?.[0]?.total || 0;
    const internalSales = internalSalesStats?.[0]?.total || 0;

    console.log('Dashboard Summary Stats:', {
      organizationId,
      ecomSalesCount: salesStats?.length || 0,
      ecomSalesTotal: ecomSales,
      internalSalesCount: internalSalesStats?.length || 0,
      internalSalesTotal: internalSales
    });

    return {
      kpis: {
        totalProducts: totalProducts || 0,
        totalSuppliers: totalSuppliers || 0,
        totalStockQty: stockQty[0]?.qty || 0,
        totalPurchaseAmount: receivedAmount, // Only count received in total spend
        totalSalesAmount: ecomSales + internalSales
      },
      alerts: {
        lowStockCount: lowStockItems.length || 0,
        lowStockItems: lowStockItems || []
      },
      widgets: {
        pendingPurchases: pendingPurchases || 0,
        approvedPurchases: approvedPurchases || 0,
        pendingPurchaseAmount: pendingAmount,
        approvedPurchaseAmount: receivedAmount,
        stockInToday: stockInToday[0]?.qty || 0,
        stockOutToday: stockOutToday[0]?.qty || 0
      },
      recentApprovedPurchases: recentApprovedPurchases || []
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    throw error;
  }
};

exports.getStockTrend = async (days = 30, user, organizationId) => {
  try {
    const userIds = await getAccessibleUserIds(user.role, user.userid);
    const movementFilter = buildFilter(organizationId, user.role, userIds, 'user');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stockTrend = await StockMovement.aggregate([
      { $match: { ...movementFilter, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          inQty: { $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$quantity", 0] } },
          outQty: { $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$quantity", 0] } }
        }
      },
      { $sort: { "_id": 1 } },
      { $project: { date: "$_id", inQty: 1, outQty: 1, _id: 0 } }
    ]);

    return stockTrend;
  } catch (error) {
    console.error('Stock trend error:', error);
    throw error;
  }
};

exports.getPurchaseTrend = async (days = 30, user, organizationId) => {
  try {
    const userIds = await getAccessibleUserIds(user.role, user.userid);
    const purchaseFilter = buildFilter(organizationId, user.role, userIds, 'createdBy');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const purchaseTrend = await PurchaseOrder.aggregate([
      { $match: { ...purchaseFilter, createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalAmount: { $sum: "$totalamount" },
          totalQuantity: { $sum: "$items.quantity" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $project: { date: "$_id", totalAmount: 1, totalQuantity: 1, count: 1, _id: 0 } }
    ]);

    return purchaseTrend;
  } catch (error) {
    console.error('Purchase trend error:', error);
    throw error;
  }
};


exports.getSalesTrend = async (days = 30, user, organizationId) => {
  try {
    const orgId = new mongoose.Types.ObjectId(organizationId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const matchFilter = {
      organizationId: orgId,
      createdAt: { $gte: startDate }
    };

    console.log('--- Sales Trend Debug ---');
    console.log('Org:', organizationId);
    console.log('Start Date:', startDate);
    console.log('Match Filter:', JSON.stringify(matchFilter));

    // Diagnostic counts
    const ecomCount = await Order.countDocuments({ organizationId: orgId, status: { $ne: 'cancelled' } });
    const internalCount = await SalesOrder.countDocuments({ organizationId: orgId });
    console.log(`Total Ecom Orders (all time): ${ecomCount}`);
    console.log(`Total Internal Orders (all time): ${internalCount}`);

    const [ecomTrend, internalTrend] = await Promise.all([
      Order.aggregate([
        { $match: { ...matchFilter, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 }
          }
        }
      ]),
      SalesOrder.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalRevenue: { $sum: "$totalamount" },
            totalOrders: { $sum: 1 }
          }
        }
      ])
    ]);

    console.log(`Ecom trend points: ${ecomTrend.length}, Internal trend points: ${internalTrend.length}`);

    // Combine trends
    const combinedMap = new Map();

    [...ecomTrend, ...internalTrend].forEach(item => {
      if (combinedMap.has(item._id)) {
        const existing = combinedMap.get(item._id);
        combinedMap.set(item._id, {
          date: item._id,
          totalRevenue: (existing.totalRevenue || 0) + (item.totalRevenue || 0),
          totalOrders: (existing.totalOrders || 0) + (item.totalOrders || 0)
        });
      } else {
        combinedMap.set(item._id, {
          date: item._id,
          totalRevenue: item.totalRevenue || 0,
          totalOrders: item.totalOrders || 0
        });
      }
    });

    const result = Array.from(combinedMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    console.log(`Combined sales trend result points: ${result.length}`);
    return result;
  } catch (error) {
    console.error('Sales trend error:', error);
    throw error;
  }
};

exports.getOrderStatusAnalytics = async (days = 7, user, organizationId) => {
  try {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get products for this organization (same as admin-order controller)
    const orgProducts = await Product.find({ organizationId: new mongoose.Types.ObjectId(organizationId) }).select('_id').lean();
    const productIds = orgProducts.map(p => p._id);


    if (productIds.length === 0) {
      console.log('No products found for this organization!');
      return [];
    }

    const filter = {
      'items.product': { $in: productIds },
      createdAt: { $gte: startDate, $lte: endDate }
    };

    const totalOrders = await Order.countDocuments(filter);

    const statusTrend = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          },
          totalDayOrders: { $sum: "$count" }
        }
      },
      { $sort: { "_id": 1 } },
      {
        $project: {
          date: "$_id",
          total: "$totalDayOrders",
          processing: {
            $sum: {
              $map: {
                input: { $filter: { input: "$statuses", as: "s", cond: { $eq: ["$$s.status", "processing"] } } },
                as: "item",
                in: "$$item.count"
              }
            }
          },
          completed: {
            $sum: {
              $map: {
                input: { $filter: { input: "$statuses", as: "s", cond: { $eq: ["$$s.status", "delivered"] } } },
                as: "item",
                in: "$$item.count"
              }
            }
          },
          pending: {
            $sum: {
              $map: {
                input: { $filter: { input: "$statuses", as: "s", cond: { $eq: ["$$s.status", "pending"] } } },
                as: "item",
                in: "$$item.count"
              }
            }
          },
          returned: {
            $sum: {
              $map: {
                input: { $filter: { input: "$statuses", as: "s", cond: { $eq: ["$$s.status", "cancelled"] } } },
                as: "item",
                in: "$$item.count"
              }
            }
          }
        }
      }
    ]);


    return statusTrend;
  } catch (error) {
    console.error('Order Status Analytics error:', error);
    throw error;
  }
};

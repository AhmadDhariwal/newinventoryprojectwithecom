const Order = require('../models/order');
const Product = require('../models/product');

// Get All Orders (Admin/Manager)
const getAllOrders = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { page = 1, limit = 10, status, search } = req.query;

        // Find products belonging to this organization
        const orgProducts = await Product.find({ organizationId }).select('_id').lean();
        const productIds = orgProducts.map(p => p._id);

        // Find orders containing these products
        const query = { 'items.product': { $in: productIds } };

        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('customerId', 'name email phone')
            .populate('items.product', 'name sku price images')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Order Details
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;

        const order = await Order.findById(id)
            .populate('customerId', 'name email phone')
            .populate('items.product', 'name sku price images')
            .populate('items.warehouse', 'name address')
            .lean();

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify organization owns at least one product in the order
        const orgProducts = await Product.find({ organizationId }).select('_id').lean();
        const productIds = orgProducts.map(p => p._id.toString());
        const hasAccess = order.items.some(item => productIds.includes(item.product._id.toString()));

        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentStatus } = req.body;
        const organizationId = req.organizationId;

        const order = await Order.findById(id).populate('items.product', 'organizationId');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify organization owns at least one product in the order
        const hasAccess = order.items.some(item => 
            item.product && item.product.organizationId.toString() === organizationId.toString()
        );

        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;

        await order.save();

        const updatedOrder = await Order.findById(id)
            .populate('customerId', 'name email phone')
            .populate('items.product', 'name sku price images');

        res.json({ success: true, message: 'Order updated successfully', data: updatedOrder });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllOrders,
    getOrderById,
    updateOrderStatus
};

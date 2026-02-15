const Order = require('../models/order');

// Get All Orders (Admin/Manager)
const getAllOrders = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { page = 1, limit = 10, status, search } = req.query;

        const query = { organizationId };

        if (status) {
            query.status = status;
        }

        if (search) {
            // Search by Order ID or Customer Name (need lookup for name, simpler to search ID for now)
            // Or use regex for string fields
            query.$or = [
                { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
                { 'shippingAddress.email': { $regex: search, $options: 'i' } } // If we had email in address, actually email is in Customer
            ].filter(c => c !== null);
            // Improving search to include Customer name would require aggregation or populate match
        }

        const orders = await Order.find()   //(query)
            .populate('customerId', 'name email phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(); //(query)
  console.log("Found : ",total);
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

        const order = await Order.findOne({ _id: id, organizationId })
            .populate('customerId', 'name email phone')
            .populate('items.product', 'name sku price images');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
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

        const order = await Order.findOne({ _id: id, organizationId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;

        await order.save();

        res.json({ success: true, message: 'Order updated successfully', data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllOrders,
    getOrderById,
    updateOrderStatus
};

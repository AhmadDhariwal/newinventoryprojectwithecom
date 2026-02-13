const Complaint = require('../models/complaint');
const Order = require('../models/order');
const Customer = require('../models/customer');

// Create Complaint
const createComplaint = async (req, res) => {
    try {
        const { orderId, category, description, organizationId } = req.body;

        // If logged in, we could verify the customer matches the order, 
        // but for guests we just rely on Order ID validity.
        const customerIdFromToken = req.customer?.customerId;

        if (!orderId || !description || !organizationId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Find Order to get Customer ID
        const order = await Order.findOne({ _id: orderId, organizationId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found. Please check the Order ID.' });
        }

        // If logged in, verify ownership (optional but good security)
        if (customerIdFromToken && order.customerId.toString() !== customerIdFromToken.toString()) {
            // Decide whether to block or allow. 
            // If a user logs in and tries to complain about someone else's order, block.
            return res.status(403).json({ success: false, message: 'You are not authorized to file a complaint for this order.' });
        }

        const complaint = new Complaint({
            orderId,
            customerId: order.customerId, // Use the customer linked to the order
            category,
            description,
            organizationId,
            status: 'pending'
        });

        await complaint.save();

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            data: complaint
        });

    } catch (error) {
        console.error('Complaint Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createComplaint
};

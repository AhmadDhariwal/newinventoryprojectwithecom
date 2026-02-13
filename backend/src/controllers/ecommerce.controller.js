const ecommerceService = require('../services/ecommerce.service');

// Customer Registration
const register = async (req, res) => {
    try {
        const { organizationId } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Organization ID is required'
            });
        }

        const customer = await ecommerceService.registerCustomer(req.body, organizationId);

        res.status(201).json({
            success: true,
            message: 'Customer registered successfully',
            data: customer
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Customer Login
const login = async (req, res) => {
    try {
        const { email, password, organizationId } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Organization ID is required'
            });
        }

        const result = await ecommerceService.loginCustomer(email, password, organizationId);

        res.json({
            success: true,
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// Get Public Products
const getProducts = async (req, res) => {
    try {
        const filters = {
            category: req.query.category,
            search: req.query.search,
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice
        };

        const products = await ecommerceService.getPublicProducts(filters);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Product Details
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ecommerceService.getProductDetails(id);

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

// Get Categories
const getCategories = async (req, res) => {
    try {
        const categories = await ecommerceService.getCategories();

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create Order
const createOrder = async (req, res) => {
    try {
        const customerId = req.customer?.customerId;
        // If logged in, use orgId from token. If guest, expect it in body.
        const organizationId = req.customer?.organizationId || req.body.organizationId;

        if (!organizationId) {
            return res.status(400).json({ success: false, message: 'Organization ID is required' });
        }

        const order = await ecommerceService.createOrder(customerId, req.body, organizationId);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// Get Customer Orders
const getOrders = async (req, res) => {
    try {
        const customerId = req.customer.customerId;
        const organizationId = req.customer.organizationId;

        const orders = await ecommerceService.getCustomerOrders(customerId, organizationId);

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Order Details
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.customer.customerId;
        const organizationId = req.customer.organizationId;

        const order = await ecommerceService.getOrderDetails(id, customerId, organizationId);

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

// Process Refund
const requestRefund = async (req, res) => {
    try {
        const customerId = req.customer.customerId;
        const organizationId = req.customer.organizationId;

        const refund = await ecommerceService.processRefund(customerId, req.body, organizationId);

        res.status(201).json({
            success: true,
            message: 'Refund request created successfully',
            data: refund
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get Customer Profile
const getProfile = async (req, res) => {
    try {
        const customerId = req.customer.customerId;
        const organizationId = req.customer.organizationId;

        const profile = await ecommerceService.getCustomerProfile(customerId, organizationId);

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

// Submit Contact Message
const submitContact = async (req, res) => {
    try {
        const { organizationId } = req.body;
        if (!organizationId) {
            return res.status(400).json({ success: false, message: 'Organization ID is required' });
        }

        const contact = await ecommerceService.saveContactMessage(req.body, organizationId);
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: contact
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Submit Complaint
const submitComplaint = async (req, res) => {
    try {
        const customerId = req.customer.customerId;
        const organizationId = req.customer.organizationId;

        const complaint = await ecommerceService.submitComplaint(customerId, req.body, organizationId);
        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            data: complaint
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Validate Coupon
const checkCoupon = async (req, res) => {
    try {
        const { code, organizationId } = req.body;
        const customerId = req.customer?.customerId;

        if (!organizationId) {
            return res.status(400).json({ success: false, message: 'Organization ID is required' });
        }

        const coupon = await ecommerceService.validateCoupon(code, customerId, organizationId);
        res.json({
            success: true,
            data: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update Customer Profile

const updateProfile = async (req, res) => {
    try {
        const customerId = req.customer.customerId;
        const organizationId = req.customer.organizationId;

        const updatedProfile = await ecommerceService.updateCustomerProfile(customerId, req.body, organizationId);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedProfile
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {

    register,
    login,
    getProducts,
    getProductById,
    getCategories,
    createOrder,
    getOrders,
    getOrderById,
    requestRefund,
    getProfile,
    updateProfile,
    submitContact,
    submitComplaint,
    checkCoupon
};


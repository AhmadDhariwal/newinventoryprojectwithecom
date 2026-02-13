const mongoose = require('mongoose');
const Customer = require('../models/customer');
const Order = require('../models/order');
const Refund = require('../models/refund');
const Product = require('../models/product');
const StockMovement = require('../models/stockmovement');
const StockLevel = require('../models/stocklevel');
const Warehouse = require('../models/warehouse');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Customer Registration
const registerCustomer = async (data, organizationId) => {
    const { name, email, password, phone } = data;

    if (!organizationId) throw new Error('Organization ID is required');

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email, organizationId });
    if (existingCustomer) {
        throw new Error('Customer with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const customer = await Customer.create({
        name,
        email,
        password: hashedPassword,
        phone: phone || '',
        organizationId
    });

    return {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
    };
};

// Customer Login
const loginCustomer = async (email, password, organizationId) => {
    if (!organizationId) throw new Error('Organization ID is required');

    const customer = await Customer.findOne({ email, organizationId, isActive: true });
    if (!customer) {
        throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    // Update last login
    customer.lastLogin = new Date();
    await customer.save();

    // Generate JWT token
    const token = jwt.sign(
        {
            customerId: customer._id,
            email: customer.email,
            organizationId: customer.organizationId,
            role: 'customer'
        },
        'Hello', // Use same secret as main auth
        { expiresIn: '7d' }
    );

    return {
        token,
        customer: {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone
        }
    };
};

// Get Public Products (for browsing without authentication)
const getPublicProducts = async (organizationId, filters = {}) => {
    if (!organizationId) throw new Error('Organization ID is required');

    const query = {
        organizationId,
        status: 'active' // Only show active products
    };

    // Apply filters
    if (filters.category) {
        query.category = filters.category;
    }

    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } },
            { sku: { $regex: filters.search, $options: 'i' } }
        ];
    }

    if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = parseFloat(filters.minPrice);
        if (filters.maxPrice) query.price.$lte = parseFloat(filters.maxPrice);
    }

    const products = await Product.find(query)
        .populate('category', 'name')
        .select('name sku description price category status')
        .sort({ createdAt: -1 })
        .lean();

    // Get stock levels for each product
    const productsWithStock = await Promise.all(products.map(async (product) => {
        const stockLevels = await StockLevel.find({
            product: product._id,
            organizationId
        }).lean();

        const totalStock = stockLevels.reduce((sum, level) => sum + (level.quantity || 0), 0);

        return {
            ...product,
            stockAvailable: totalStock,
            inStock: totalStock > 0
        };
    }));

    return productsWithStock;
};

// Get Single Product Details
const getProductDetails = async (productId, organizationId) => {
    if (!organizationId) throw new Error('Organization ID is required');

    const product = await Product.findOne({
        _id: productId,
        organizationId,
        status: 'active'
    })
        .populate('category', 'name')
        .select('name sku description price category status')
        .lean();

    if (!product) {
        throw new Error('Product not found');
    }

    // Get stock levels
    const stockLevels = await StockLevel.find({
        product: productId,
        organizationId
    })
        .populate('warehouse', 'name')
        .lean();

    const totalStock = stockLevels.reduce((sum, level) => sum + (level.quantity || 0), 0);

    return {
        ...product,
        stockAvailable: totalStock,
        inStock: totalStock > 0,
        stockByWarehouse: stockLevels.map(level => ({
            warehouse: level.warehouse,
            quantity: level.quantity
        }))
    };
};

// Create Order (Transaction Safe)
const createOrder = async (customerId, orderData, organizationId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, shippingAddress, billingAddress, paymentMethod } = orderData;

        if (!customerId) throw new Error('Customer ID is required');
        if (!organizationId) throw new Error('Organization ID is required');
        if (!items || items.length === 0) throw new Error('Order must contain at least one item');

        let totalAmount = 0;

        // Get default warehouse for the organization
        const defaultWarehouse = await Warehouse.findOne({ organizationId }).session(session).sort({ createdAt: 1 });
        if (!defaultWarehouse) {
            throw new Error('No warehouse found for this organization');
        }

        // Validate items and check stock
        const validatedItems = [];
        for (let item of items) {
            const product = await Product.findOne({
                _id: item.product,
                organizationId,
                status: 'active'
            }).session(session);

            if (!product) {
                throw new Error(`Product not found: ${item.product}`);
            }

            // Use warehouse from item or default warehouse
            const warehouseId = item.warehouse || defaultWarehouse._id;

            // Check stock availability
            const stockLevel = await StockLevel.findOne({
                product: item.product,
                warehouse: warehouseId,
                organizationId
            }).session(session);

            const availableStock = stockLevel ? stockLevel.quantity : 0;

            if (availableStock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${availableStock}, Required: ${item.quantity}`);
            }

            // Calculate item total
            const itemPrice = item.price || product.price;
            const itemTotal = itemPrice * item.quantity;
            totalAmount += itemTotal;

            validatedItems.push({
                product: item.product,
                quantity: item.quantity,
                price: itemPrice,
                warehouse: warehouseId
            });

            // Deduct stock
            stockLevel.quantity -= item.quantity;
            await stockLevel.save({ session });

            // Create outbound stock movement
            await StockMovement.create([{
                product: item.product,
                warehouse: warehouseId,
                type: 'OUT',
                quantity: item.quantity,
                reason: 'E-COMMERCE_ORDER',
                user: customerId, // Using customerId as user reference
                organizationId
            }], { session });
        }

        // Create order
        const orderArr = await Order.create([{
            customerId,
            items: validatedItems,
            totalAmount,
            shippingAddress,
            billingAddress,
            paymentMethod: paymentMethod || 'cash_on_delivery',
            status: 'pending',
            paymentStatus: 'pending',
            organizationId
        }], { session });

        const order = orderArr[0];

        await session.commitTransaction();
        session.endSession();

        await order.populate('customerId', 'name email');
        await order.populate('items.product', 'name sku price');

        return order;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// Get Customer Orders
const getCustomerOrders = async (customerId, organizationId) => {
    if (!customerId) throw new Error('Customer ID is required');
    if (!organizationId) throw new Error('Organization ID is required');

    const orders = await Order.find({
        customerId,
        organizationId
    })
        .populate('items.product', 'name sku price')
        .sort({ createdAt: -1 })
        .lean();

    return orders;
};

// Get Order Details
const getOrderDetails = async (orderId, customerId, organizationId) => {
    if (!orderId) throw new Error('Order ID is required');
    if (!customerId) throw new Error('Customer ID is required');
    if (!organizationId) throw new Error('Organization ID is required');

    const order = await Order.findOne({
        _id: orderId,
        customerId,
        organizationId
    })
        .populate('customerId', 'name email phone')
        .populate('items.product', 'name sku price')
        .populate('items.warehouse', 'name')
        .lean();

    if (!order) {
        throw new Error('Order not found');
    }

    return order;
};

// Process Refund (Transaction Safe)
const processRefund = async (customerId, refundData, organizationId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId, items, reason } = refundData;

        if (!customerId) throw new Error('Customer ID is required');
        if (!organizationId) throw new Error('Organization ID is required');
        if (!orderId) throw new Error('Order ID is required');

        // Verify order exists and belongs to customer
        const order = await Order.findOne({
            _id: orderId,
            customerId,
            organizationId
        }).session(session);

        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status === 'cancelled') {
            throw new Error('Cannot refund a cancelled order');
        }

        let totalRefundAmount = 0;
        const refundItems = [];

        // Validate refund items
        for (let refundItem of items) {
            const orderItem = order.items.find(
                item => item.product.toString() === refundItem.product.toString()
            );

            if (!orderItem) {
                throw new Error(`Product ${refundItem.product} not found in order`);
            }

            if (refundItem.quantity > orderItem.quantity) {
                throw new Error(`Refund quantity exceeds ordered quantity for product ${refundItem.product}`);
            }

            const refundAmount = orderItem.price * refundItem.quantity;
            totalRefundAmount += refundAmount;

            refundItems.push({
                product: refundItem.product,
                quantity: refundItem.quantity,
                refundAmount,
                warehouse: orderItem.warehouse
            });

            // Return stock to warehouse
            const stockLevel = await StockLevel.findOne({
                product: refundItem.product,
                warehouse: orderItem.warehouse,
                organizationId
            }).session(session);

            if (stockLevel) {
                stockLevel.quantity += refundItem.quantity;
                await stockLevel.save({ session });
            }

            // Create inbound stock movement
            await StockMovement.create([{
                product: refundItem.product,
                warehouse: orderItem.warehouse,
                type: 'IN',
                quantity: refundItem.quantity,
                reason: 'E-COMMERCE_REFUND',
                user: customerId,
                referenceId: orderId,
                organizationId
            }], { session });
        }

        // Create refund record
        const refundArr = await Refund.create([{
            orderId,
            customerId,
            items: refundItems,
            totalRefundAmount,
            reason,
            status: 'pending',
            organizationId
        }], { session });

        const refund = refundArr[0];

        // Update order payment status if full refund
        if (totalRefundAmount >= order.totalAmount) {
            order.paymentStatus = 'refunded';
            await order.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        await refund.populate('orderId');
        await refund.populate('customerId', 'name email');
        await refund.populate('items.product', 'name sku');

        return refund;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// Get Customer Profile
const getCustomerProfile = async (customerId, organizationId) => {
    if (!customerId) throw new Error('Customer ID is required');
    if (!organizationId) throw new Error('Organization ID is required');

    const customer = await Customer.findOne({
        _id: customerId,
        organizationId
    }).select('-password').lean();

    if (!customer) {
        throw new Error('Customer not found');
    }

    return customer;
};

// Update Customer Profile
const updateCustomerProfile = async (customerId, updateData, organizationId) => {
    if (!customerId) throw new Error('Customer ID is required');
    if (!organizationId) throw new Error('Organization ID is required');

    // Don't allow updating password, email, or organizationId through this method
    delete updateData.password;
    delete updateData.email;
    delete updateData.organizationId;

    const customer = await Customer.findOneAndUpdate(
        { _id: customerId, organizationId },
        updateData,
        { new: true, runValidators: true }
    ).select('-password');

    if (!customer) {
        throw new Error('Customer not found');
    }

    return customer;
};

// Get Categories
const getCategories = async (organizationId) => {
    if (!organizationId) throw new Error('Organization ID is required');

    const Category = require('../models/category');
    
    const categories = await Category.find({
        organizationId,
        status: 'active'
    })
        .select('name description')
        .sort({ name: 1 })
        .lean();

    return categories;
};

module.exports = {
    registerCustomer,
    loginCustomer,
    getPublicProducts,
    getProductDetails,
    getCategories,
    createOrder,
    getCustomerOrders,
    getOrderDetails,
    processRefund,
    getCustomerProfile,
    updateCustomerProfile
};

const mongoose = require('mongoose');
const Customer = require('../models/customer');
const Order = require('../models/order');
const Refund = require('../models/refund');
const Product = require('../models/product');
const StockMovement = require('../models/stockmovement');
const StockLevel = require('../models/stocklevel');
const Warehouse = require('../models/warehouse');
const Contact = require('../models/contact');
const Complaint = require('../models/complaint');
const Notification = require('../models/notification');
const Coupon = require('../models/coupon');
const notificationService = require('./notification.service');
const Category = require('../models/category');

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
const getPublicProducts = async (filters = {}) => {
    const query = {
        status: 'active'
    };

    if (filters.organizationId) {
        query.organizationId = filters.organizationId;
    }

    if (filters.category) {
        const Category = require('../models/category');
        const getSubcategoryIds = async (parentId) => {
            const subs = await Category.find({ parentId, status: 'active' }).select('_id');
            let ids = subs.map(s => s._id);
            for (const sub of subs) {
                const nestedIds = await getSubcategoryIds(sub._id);
                ids = ids.concat(nestedIds);
            }
            return ids;
        };
        const subIds = await getSubcategoryIds(filters.category);
        query.category = { $in: [filters.category, ...subIds] };
    }

    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } },
            { sku: { $regex: filters.search, $options: 'i' } }
        ];
    }

    if (filters.onlySale === 'true' || filters.onlySale === true) {
        query.discountPrice = { $ne: null };
    }

    if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = parseFloat(filters.minPrice);
        if (filters.maxPrice) query.price.$lte = parseFloat(filters.maxPrice);
    }


    const products = await Product.find(query)
        .populate('category', 'name')
        .select('name sku description price discountPrice discountPercentage category status images averageRating totalReviews')
        .sort({ createdAt: -1 })
        .lean();

    const productsWithStock = await Promise.all(products.map(async (product) => {
        const stockLevels = await StockLevel.find({
            product: product._id
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
const getProductDetails = async (productId) => {
    const product = await Product.findOne({
        _id: productId,
        status: 'active'
    })
        .populate('category', 'name')
        .select('name sku description price discountPrice discountPercentage category status images averageRating totalReviews ratingBreakdown')
        .lean();

    if (!product) {
        throw new Error('Product not found');
    }

    const stockLevels = await StockLevel.find({
        product: productId
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

// Validate Coupon
const validateCoupon = async (code, customerId, organizationId) => {
    if (!code) throw new Error('Coupon code is required');
    if (!organizationId) throw new Error('Organization ID is required');

    const coupon = await Coupon.findOne({
        code: code.toUpperCase(),
        organizationId,
        isActive: true
    });

    if (!coupon) {
        throw new Error('Invalid or expired coupon code');
    }

    if (!coupon.isValid(customerId)) {
        throw new Error('This coupon is no longer valid for you');
    }

    return coupon;
};

// Create Order (Transaction Safe)

const createOrder = async (customerId, orderData, organizationId) => {
    // Transaction removed for standalone MongoDB support
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
        const { items, shippingAddress, billingAddress, paymentMethod, couponCode, guestDetails } = orderData;

        // Handle Guest Checkout
        if (!customerId) {
            if (!guestDetails || !guestDetails.email || !guestDetails.name) {
                throw new Error('Customer details are required for guest checkout');
            }

            // Check if customer exists by email
            let guestCustomer = await Customer.findOne({
                email: guestDetails.email.toLowerCase(),
                organizationId
            });

            if (!guestCustomer) {
                // Create new guest customer
                guestCustomer = await Customer.create({
                    name: guestDetails.name,
                    email: guestDetails.email,
                    phone: guestDetails.phone || '',
                    organizationId,
                    isGuest: true,
                    password: undefined // Explicitly undefined to ensure it's not set
                });
                // guestCustomer = guestCustomer[0]; // Not an array when not using session
            }
            customerId = guestCustomer._id;
        }

        if (!customerId) throw new Error('Customer ID is required');
        if (!organizationId) throw new Error('Organization ID is required');
        if (!items || items.length === 0) throw new Error('Order must contain at least one item');


        let totalAmount = 0;

        // Get default warehouse for the organization
        let defaultWarehouse = await Warehouse.findOne({ organizationId, isActive: true }).sort({ createdAt: 1 });
        if (!defaultWarehouse) {
            // Auto-create a default warehouse if none exists
            defaultWarehouse = await Warehouse.create({
                name: 'Default Warehouse',
                address: 'Auto-generated default warehouse',
                organizationId,
                createdBy: customerId,
                isActive: true
            });
        }

        // Validate items and check stock
        const validatedItems = [];
        for (let item of items) {
            const product = await Product.findOne({
                _id: item.product,
                status: 'active'
            });

            if (!product) {
                throw new Error(`Product not found: ${item.product}`);
            }

            // Find stock across ALL warehouses for this product (not limited to customer's org)
            const allStockLevels = await StockLevel.find({
                product: item.product
            }).sort({ quantity: -1 });

            const totalAvailableStock = allStockLevels.reduce((sum, level) => sum + (level.quantity || 0), 0);

            if (totalAvailableStock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${totalAvailableStock}, Required: ${item.quantity}`);
            }

            // Use the warehouse with the most stock or the product's organization warehouse
            let warehouseId = allStockLevels[0]?.warehouse || defaultWarehouse._id;
            let stockLevel = allStockLevels[0];

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
            if (stockLevel) {
                stockLevel.quantity -= item.quantity;
                await StockLevel.findByIdAndUpdate(stockLevel._id, { quantity: stockLevel.quantity });
            }

            // Create outbound stock movement
            await StockMovement.create({
                product: item.product,
                warehouse: warehouseId,
                type: 'OUT',
                quantity: item.quantity,
                reason: 'E-COMMERCE_ORDER',
                user: customerId,
                organizationId: product.organizationId
            });
        }

        // Create order
        let discountAmount = 0;
        let originalAmount = totalAmount;

        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                organizationId,
                isActive: true
            });

            if (coupon && coupon.isValid(customerId)) {
                if (coupon.discountType === 'percentage') {
                    discountAmount = (totalAmount * coupon.discountValue) / 100;
                } else {
                    discountAmount = coupon.discountValue;
                }
                totalAmount = Math.max(0, totalAmount - discountAmount);

                // Update coupon usage
                coupon.usedCount += 1;
                coupon.usedBy.push(customerId);
                await coupon.save();
            }
        }

        const order = await Order.create({
            customerId,
            items: validatedItems,
            totalAmount,
            discountAmount,
            originalAmount,
            couponCode: couponCode ? couponCode.toUpperCase() : null,
            shippingAddress,
            billingAddress,

            paymentMethod: paymentMethod || 'cash_on_delivery',
            status: 'pending',
            paymentStatus: 'pending',
            organizationId
        });

        // Loop populate separately if needed or just return ID and frontend fetches details
        // await order.populate('customerId', 'name email');
        // await order.populate('items.product', 'name sku price');

        // Send notifications to Admin and Manager
        try {
            const customer = await Customer.findById(customerId);
            await notificationService.notifyOrganizationRole(
                organizationId,
                'admin',
                'ORDER_STATUS',
                'New E-commerce Order',
                `A new order (#${order._id}) has been placed by ${customer.name}.`,
                { orderId: order._id }
            );
            await notificationService.notifyOrganizationRole(
                organizationId,
                'manager',
                'ORDER_STATUS',
                'New E-commerce Order',
                `A new order (#${order._id}) has been placed by ${customer.name}.`,
                { orderId: order._id }
            );

            // Check for low stock on affected products
            for (let item of validatedItems) {
                const stockLevel = await StockLevel.findOne({
                    product: item.product,
                    warehouse: item.warehouse,
                    organizationId
                });
                if (stockLevel && stockLevel.quantity <= (stockLevel.minStock || 5)) {
                    await notificationService.notifyOrganizationRole(
                        organizationId,
                        'admin',
                        'LOW_STOCK',
                        'Low Stock Alert',
                        `Product ${item.product} is low on stock in warehouse ${item.warehouse}. Current quantity: ${stockLevel.quantity}`,
                        { productId: item.product, warehouseId: item.warehouse }
                    );
                }
            }
        } catch (notifError) {
            console.error('Failed to send order notifications:', notifError);
            // Don't fail the order if notification fails
        }

        return order;
    } catch (error) {
        // await session.abortTransaction();
        // session.endSession();
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
    // Transaction removed for standalone MongoDB support
    // const session = await mongoose.startSession();
    // session.startTransaction();

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
        });

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
            });

            if (stockLevel) {
                stockLevel.quantity += refundItem.quantity;
                await stockLevel.save();
            }

            // Create inbound stock movement
            await StockMovement.create({
                product: refundItem.product,
                warehouse: orderItem.warehouse,
                type: 'IN',
                quantity: refundItem.quantity,
                reason: 'E-COMMERCE_REFUND',
                user: customerId,
                referenceId: orderId,
                organizationId
            });
        }

        // Create refund record
        const refund = await Refund.create({
            orderId,
            customerId,
            items: refundItems,
            totalRefundAmount,
            reason,
            status: 'pending',
            organizationId
        });

        // Update order payment status if full refund
        if (totalRefundAmount >= order.totalAmount) {
            order.paymentStatus = 'refunded';
            await order.save();
        }

        // await session.commitTransaction();
        // session.endSession();

        // await refund.populate('orderId');
        // await refund.populate('customerId', 'name email');
        // await refund.populate('items.product', 'name sku');

        return refund;
    } catch (error) {
        // await session.abortTransaction();
        // session.endSession();
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
const getCategories = async () => {

    const categories = await Category.find({
        isActive: true
    })
        .select('name description parentId')
        .sort({ name: 1 })
        .lean();

    return categories;
};

// Save Contact Message
const saveContactMessage = async (data, organizationId) => {
    if (!organizationId) throw new Error('Organization ID is required');

    const contact = await Contact.create({
        ...data,
        organizationId
    });

    return contact;
};

// Submit Complaint
const submitComplaint = async (customerId, data, organizationId) => {
    if (!customerId) throw new Error('Customer ID is required');
    if (!organizationId) throw new Error('Organization ID is required');

    // Verify order exists
    const order = await Order.findOne({ _id: data.orderId, customerId, organizationId });
    if (!order) throw new Error('Order not found');

    const complaint = await Complaint.create({
        ...data,
        customerId,
        organizationId
    });

    return complaint;
};

module.exports = {
    registerCustomer,
    loginCustomer,
    validateCoupon,
    getPublicProducts,

    getProductDetails,
    getCategories,
    createOrder,
    getCustomerOrders,
    getOrderDetails,
    processRefund,
    getCustomerProfile,
    updateCustomerProfile,
    saveContactMessage,
    submitComplaint
};

const mongoose = require('mongoose');
const Product = require('../models/product');
const Order = require('../models/order');
const StockLevel = require('../models/stocklevel');
const ChatLog = require('../models/chatLog');
const ecommerceService = require('./ecommerce.service');

class ChatbotService {
    constructor() {
        this.sessions = {}; // In-memory session store
        this.SESSION_EXPIRY = 5 * 60 * 1000; // 5 minutes
        this.RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
        this.MAX_REQUESTS = 10;
        this.userRequests = {};
    }

    // --- Session Management ---

    cleanupSessions() {
        const now = Date.now();
        for (const userId in this.sessions) {
            if (now - this.sessions[userId].lastActive > this.SESSION_EXPIRY) {
                delete this.sessions[userId];
            }
        }
    }

    getContext(userId) {
        return this.sessions[userId] || {};
    }

    setContext(userId, context) {
        this.sessions[userId] = {
            ...this.sessions[userId],
            ...context,
            lastActive: Date.now()
        };
    }

    clearContext(userId) {
        if (this.sessions[userId]) {
            delete this.sessions[userId];
        }
    }

    // --- Rate Limiting ---

    checkRateLimit(userId) {
        const now = Date.now();
        if (!this.userRequests[userId]) {
            this.userRequests[userId] = [];
        }

        // Filter out old checks
        this.userRequests[userId] = this.userRequests[userId].filter(timestamp => now - timestamp < this.RATE_LIMIT_WINDOW);

        if (this.userRequests[userId].length >= this.MAX_REQUESTS) {
            return false;
        }

        this.userRequests[userId].push(now);
        return true;
    }

    // --- Main Processing ---

    async processQuery(userId, role, orgId, query) {
        let intentData = { intent: 'UNKNOWN_INTENT' };
        let response = { success: false, intent: 'UNKNOWN_INTENT', response: "Sorry, I encountered an error." };
        let errorMsg = null;

        try {
            // 0. Cleanup Sessions
            this.cleanupSessions();

            // 1. Rate Check
            if (!this.checkRateLimit(userId)) {
                return {
                    success: false,
                    intent: 'RATE_LIMIT_EXCEEDED',
                    response: "You are sending messages too quickly. Please wait a moment."
                };
            }

            // 2. Intent Detection
            const context = this.getContext(userId);
            intentData = this.detectIntent(query, role, context);

            // 3. Execution
            response = await this.executeIntent(intentData, userId, role, orgId);

            // 4. Update Context
            if (intentData.nextContext) {
                this.setContext(userId, intentData.nextContext);
            } else if (intentData.clearContext) {
                this.clearContext(userId);
            } else {
                // Refresh session even if context didn't change
                this.setContext(userId, {});
            }

        } catch (error) {
            console.error("Chatbot Process Error:", error);
            response = {
                success: false,
                intent: intentData.intent || 'ERROR',
                response: "Sorry, something went wrong while processing your request."
            };
            errorMsg = error.message;
        } finally {
            // 5. Logging - ensure this doesn't crash if orgId is missing
            try {
                await this.logInteraction(userId, role, orgId, intentData.intent, query, response.response, response.success, errorMsg);
            } catch (logErr) {
                console.error("Critical Logging Error:", logErr);
            }
        }

        return response;
    }

    // --- Intent Detection ---

    detectIntent(query, role, context) {
        const q = query.toLowerCase().trim();

        if (role === 'customer') {
            return this.detectCustomerIntent(q, context);
        } else if (['admin', 'manager', 'organization_user'].includes(role)) {
            return this.detectInternalIntent(q, context);
        }

        return { intent: 'UNAUTHORIZED' };
    }

    detectCustomerIntent(q, context) {
        // Context-driven
        if (context.awaitingOrderId) {
            // Simple check if it looks like an ID or they are asking to cancel
            if (q.match(/^[a-f0-9]{24}$/i)) {
                return { intent: 'TRACK_SPECIFIC_ORDER', orderId: q };
            }
            if (q.includes('cancel') || q.includes('stop') || q.includes('no')) {
                return { intent: 'CANCEL_CONTEXT', clearContext: true };
            }
        }

        if (q.includes('track') || q.includes('order') || q.includes('status')) return { intent: 'TRACK_ORDER', nextContext: { awaitingOrderId: true } };
        if (q.includes('price') || q.includes('cost')) return { intent: 'PRODUCT_PRICE_QUERY', query: q }; // Reuse search logic
        if (q.includes('search') || q.includes('find') || q.includes('looking for') || q.includes('product')) return { intent: 'SEARCH_PRODUCT', query: q };
        if (q.includes('return') || q.includes('refund')) return { intent: 'RETURN_POLICY' };
        if (q.includes('ship') || q.includes('delivery')) return { intent: 'SHIPPING_INFORMATION' };
        if (q.includes('hi') || q.includes('hello') || q.includes('hey')) return { intent: 'GREETING' };

        return { intent: 'UNKNOWN_INTENT' };
    }

    detectInternalIntent(q, context) {
        if (q.includes('sales') && (q.includes('today') || q.includes('daily'))) return { intent: 'TODAY_SALES' };
        if (q.includes('top') && (q.includes('product') || q.includes('selling'))) return { intent: 'TOP_SELLING_PRODUCTS' };
        if (q.includes('value') && q.includes('stock')) return { intent: 'TOTAL_STOCK_VALUE' };
        if (q.includes('sales') || q.includes('revenue')) return { intent: 'SALES_SUMMARY' };

        if (q.includes('low') && (q.includes('stock') || q.includes('alert'))) return { intent: 'LOW_STOCK_ALERT' };
        if (q.includes('stock') || q.includes('inventory') || q.includes('check')) return { intent: 'CHECK_STOCK', query: q };

        return { intent: 'UNKNOWN_INTENT' };
    }

    // --- Execution Handlers ---

    async executeIntent(intentData, userId, role, orgId) {
        // STRICT ROLE RE-VALIDATION
        if (role === 'customer') {
            if (!['GREETING', 'TRACK_ORDER', 'TRACK_SPECIFIC_ORDER', 'SEARCH_PRODUCT', 'PRODUCT_PRICE_QUERY', 'RETURN_POLICY', 'SHIPPING_INFORMATION', 'CANCEL_CONTEXT', 'UNKNOWN_INTENT'].includes(intentData.intent)) {
                return { success: false, intent: intentData.intent, response: "Unauthorized access." };
            }
            return this.handleCustomerIntent(intentData, userId, orgId);
        }

        if (['admin', 'manager', 'organization_user'].includes(role)) {
            // Internal users can basically do anything internal, but we should make sure they don't trigger customer specific context flows oddly, though it's less critical.
            // Strict check for internal intents
            if (!['CHECK_STOCK', 'LOW_STOCK_ALERT', 'TODAY_SALES', 'SALES_SUMMARY', 'TOP_SELLING_PRODUCTS', 'TOTAL_STOCK_VALUE', 'UNKNOWN_INTENT'].includes(intentData.intent)) {
                // Fallback for greetings if internal user says 'hi' -> currently detected as UNKNOWN for internal, which is fine
                if (intentData.intent === 'UNKNOWN_INTENT') return { success: true, intent: 'UNKNOWN_INTENT', response: "I didn't understand that. You can ask me about stock, sales, or alerts." };

                return { success: false, intent: intentData.intent, response: "Unauthorized or unknown internal command." };
            }
            return this.handleInternalIntent(intentData, userId, orgId);
        }

        return { success: false, intent: 'UNAUTHORIZED', response: "Unauthorized role." };
    }

    async handleCustomerIntent(intentData, userId, orgId) {
        const { intent } = intentData;

        switch (intent) {
            case 'GREETING':
                return { success: true, intent, response: "Hello! How can I help you today? You can ask me to track an order or search for products." };

            case 'RETURN_POLICY':
                return { success: true, intent, response: "Our return policy allows returns within 30 days of purchase. Please keep the item in its original condition." };

            case 'SHIPPING_INFORMATION':
                return { success: true, intent, response: "We ship to most locations. Standard shipping takes 3-5 business days." };

            case 'CANCEL_CONTEXT':
                return { success: true, intent, response: "Okay." };

            case 'TRACK_ORDER':
                try {
                    const orders = await ecommerceService.getCustomerOrders(userId, orgId);
                    if (!orders || orders.length === 0) {
                        return { success: true, intent, response: "You don't have any recent orders." };
                    }
                    // Show last 3
                    const recent = orders.slice(0, 3).map(o => `Order #${o._id.toString().slice(-6)} - ${o.status} ($${o.totalAmount})`).join('\n');
                    return { success: true, intent, response: `Here are your recent orders:\n${recent}\n\nTo see details, please reply with the Order ID.` };
                } catch (e) {
                    console.error("Track Order Error:", e);
                    throw new Error("Failed to fetch orders.");
                }

            case 'TRACK_SPECIFIC_ORDER':
                try {
                    const orderId = intentData.orderId;
                    const order = await ecommerceService.getOrderDetails(orderId, userId, orgId);

                    const itemsList = order.items.map(i => `- ${i.product.name} x${i.quantity}`).join('\n');
                    const details = `Order #${order._id.toString().slice(-6)}\nStatus: ${order.status}\nTotal: $${order.totalAmount}\nItems:\n${itemsList}`;

                    return { success: true, intent, response: details };
                } catch (e) {
                    return { success: false, intent, response: "I couldn't find that order. Please check the ID." };
                }

            case 'SEARCH_PRODUCT':
            case 'PRODUCT_PRICE_QUERY':
                try {
                    const rawQuery = intentData.query || "";
                    // Basic extraction
                    const keywords = rawQuery.replace(/search|find|looking for|product|price|cost|how much is/gi, '').trim();

                    if (!keywords) return { success: true, intent, response: "What product are you looking for?" };

                    const products = await ecommerceService.getPublicProducts({
                        search: keywords,
                        organizationId: orgId ? new mongoose.Types.ObjectId(orgId) : undefined
                    });

                    const displayProducts = products.slice(0, 3);

                    if (displayProducts.length === 0) return { success: true, intent, response: "I couldn't find any products matching that." };

                    const list = displayProducts.map(p => `${p.name}: $${p.price} (${p.inStock ? 'In Stock' : 'Out of Stock'})`).join('\n');
                    return { success: true, intent, response: `Here is what I found:\n${list}` };

                } catch (e) {
                    console.error("Search Error:", e);
                    throw new Error("Failed to search products.");
                }

            case 'UNKNOWN_INTENT':
                return { success: true, intent, response: "I'm not sure I understand. You can ask me to track orders or search for products." };

            default:
                return { success: false, intent, response: "I can't do that yet." };
        }
    }

    async handleInternalIntent(intentData, userId, orgId) {
        const { intent } = intentData;
        if (!orgId) return { success: false, intent, response: "Organization ID is required for internal metrics." };
        const orgIdObj = new mongoose.Types.ObjectId(orgId);

        switch (intent) {
            case 'CHECK_STOCK':
                const stockQueryStr = intentData.query.replace(/check|stock|inventory|for/gi, '').trim();
                if (!stockQueryStr) return { success: true, intent, response: "Which product's stock do you want to check?" };

                const product = await Product.findOne({
                    organizationId: orgIdObj,
                    name: { $regex: stockQueryStr, $options: 'i' }
                });

                if (!product) return { success: true, intent, response: "Product not found." };

                const stock = await StockLevel.findOne({ product: product._id, organizationId: orgIdObj });
                return { success: true, intent, response: `${product.name}: ${stock ? stock.quantity : 0} units available.` };

            case 'LOW_STOCK_ALERT':
                const lowStock = await StockLevel.find({
                    organizationId: orgIdObj,
                    $expr: { $lte: ["$quantity", "$minStock"] }
                }).populate('product', 'name').limit(5);

                if (lowStock.length === 0) return { success: true, intent, response: "Stock levels are healthy." };

                const lowList = lowStock.map(s => `${s.product.name}: ${s.quantity} (Min: ${s.minStock})`).join('\n');
                return { success: true, intent, response: `Low stock alerts:\n${lowList}` };

            case 'TODAY_SALES':
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                const todaySales = await Order.aggregate([
                    {
                        $match: {
                            organizationId: orgIdObj,
                            createdAt: { $gte: startOfDay, $lte: endOfDay },
                            paymentStatus: 'completed' // Assuming only completed sales count
                        }
                    },
                    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
                ]);

                if (!todaySales.length) return { success: true, intent, response: "No sales recorded today." };
                return { success: true, intent, response: `Today's Sales: $${todaySales[0].total.toFixed(2)} (${todaySales[0].count} orders).` };

            case 'SALES_SUMMARY':
                // Total sales overall
                const totalSales = await Order.aggregate([
                    {
                        $match: {
                            organizationId: orgIdObj,
                            paymentStatus: 'completed'
                        }
                    },
                    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
                ]);

                if (!totalSales.length) return { success: true, intent, response: "No sales data found." };
                return { success: true, intent, response: `Total Lifetime Sales: $${totalSales[0].total.toFixed(2)} (${totalSales[0].count} orders).` };

            case 'TOP_SELLING_PRODUCTS':
                const topProducts = await Order.aggregate([
                    { $match: { organizationId: orgIdObj, paymentStatus: 'completed' } },
                    { $unwind: "$items" },
                    { $group: { _id: "$items.product", qty: { $sum: "$items.quantity" } } },
                    { $sort: { qty: -1 } },
                    { $limit: 3 },
                    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
                    { $unwind: "$product" },
                    { $project: { name: "$product.name", qty: 1 } }
                ]);

                if (!topProducts.length) return { success: true, intent, response: "No sales data available." };
                const topList = topProducts.map((p, i) => `${i + 1}. ${p.name} (${p.qty} sold)`).join('\n');
                return { success: true, intent, response: `Top Selling Products:\n${topList}` };

            case 'TOTAL_STOCK_VALUE':
                // This requires joining stock level with product price
                const stockValue = await StockLevel.aggregate([
                    { $match: { organizationId: orgIdObj } },
                    { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'prod' } },
                    { $unwind: "$prod" },
                    { $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$prod.price"] } } } }
                ]);

                if (!stockValue.length) return { success: true, intent, response: "Total Stock Value: $0.00" };
                return { success: true, intent, response: `Total Stock Value: $${stockValue[0].totalValue.toFixed(2)}` };

            default:
                return { success: false, intent: 'UNKNOWN', response: "I don't know how to handle that." };
        }
    }

    // --- Persistence ---

    async logInteraction(userId, role, organizationId, intent, query, response, success, error) {
        try {
            await ChatLog.create({
                userId,
                role,
                organizationId,
                intent,
                query,
                response,
                success,
                error
            });
        } catch (err) {
            console.error("Failed to log chat:", err);
            // Don't throw, just log
        }
    }
}

module.exports = new ChatbotService();

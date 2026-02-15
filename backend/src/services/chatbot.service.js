const Product = require('../models/product');
const Order = require('../models/order');
const StockLevel = require('../models/stocklevel');

class ChatbotService {
    constructor() {
        this.sessions = {}; // Simple in-memory session store (replace with Redis in prod)
        this.RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
        this.MAX_REQUESTS = 5;
        this.userRequests = {};
    }

    // Rate Limiting Logic
    checkRateLimit(userId) {
        const now = Date.now();
        if (!this.userRequests[userId]) {
            this.userRequests[userId] = [];
        }

        // Filter out old requests
        this.userRequests[userId] = this.userRequests[userId].filter(timestamp => now - timestamp < this.RATE_LIMIT_WINDOW);

        if (this.userRequests[userId].length >= this.MAX_REQUESTS) {
            return false;
        }

        this.userRequests[userId].push(now);
        return true;
    }

    // Logging
    logInteraction(userId, role, orgId, intent, query) {
        console.log(`[CHATBOT] User: ${userId} | Role: ${role} | Org: ${orgId} | Intent: ${intent} | Query: "${query}"`);
        // In a real app, save to a 'ChatLog' model
    }

    // Context Management
    getContext(userId) {
        return this.sessions[userId] || {};
    }

    setContext(userId, context) {
        this.sessions[userId] = { ...this.sessions[userId], ...context };
    }

    clearContext(userId) {
        delete this.sessions[userId];
    }

    // Main Process Method
    async processQuery(userId, role, orgId, query) {
        // 1. Check Rate Limit
        if (!this.checkRateLimit(userId)) {
            return {
                response: "You're sending messages too fast. Please wait a moment.",
                intent: 'RATE_LIMIT_EXCEEDED'
            };
        }

        // 2. Intent Recognition
        const context = this.getContext(userId);
        const intentData = this.detectIntent(query, role, context);

        this.logInteraction(userId, role, orgId, intentData.intent, query);

        // 3. Execute Logic
        const response = await this.executeIntent(intentData, userId, role, orgId);

        // 4. Update Context
        if (intentData.nextContext) {
            this.setContext(userId, intentData.nextContext);
        } else if (intentData.clearContext) {
            this.clearContext(userId);
        }

        return response;
    }

    detectIntent(query, role, context) {
        const q = query.toLowerCase();

        // --- Customer Intents ---
        if (role === 'customer') {
            if (q.includes('track') || q.includes('order')) return { intent: 'TRACK_ORDER', query };
            if (q.includes('search') || q.includes('find') || q.includes('looking for')) return { intent: 'SEARCH_PRODUCT', query };
            if (q.includes('return') || q.includes('refund')) return { intent: 'RETURN_POLICY' };
            if (q.includes('hi') || q.includes('hello')) return { intent: 'GREETING' };
        }

        // --- Internal Intents ---
        if (['manager', 'admin', 'superadmin', 'organization_user'].includes(role)) {
            if (q.includes('stock') || q.includes('inventory')) return { intent: 'CHECK_STOCK', query };
            if (q.includes('low') && (q.includes('stock') || q.includes('alert'))) return { intent: 'LOW_STOCK_ALERT' };
            if (q.includes('sales') || q.includes('revenue')) return { intent: 'SALES_SUMMARY' };
        }

        // --- Context-based Intents (Follow-ups) ---
        if (context.awaitingOrderId && q.match(/^[a-z0-9]{24}$/i)) { // Simple ObjectId regex check
            return { intent: 'TRACK_SPECIFIC_ORDER', orderId: q.trim() };
        }

        return { intent: 'UNKNOWN_INTENT' };
    }

    async executeIntent(intentData, userId, role, orgId) {
        try {
            switch (intentData.intent) {
                // --- Customer Handlers ---
                case 'GREETING':
                    return { response: "Hello! How can I help you today?" };

                case 'TRACK_ORDER':
                    // Fetch last 3 orders for context
                    const orders = await Order.find({ customerId: userId, organizationId: orgId })
                        .sort({ createdAt: -1 })
                        .limit(3)
                        .select('status totalAmount createdAt');

                    if (orders.length === 0) return { response: "You don't have any recent orders." };

                    let orderText = orders.map(o => `Order #${o._id.toString().slice(-4)}: ${o.status}`).join('\n');
                    return {
                        response: `Here are your recent orders:\n${orderText}\n\nTo see details, tell me the Order ID.`,
                        // set simple context if needed, though for now we just show list
                    };

                case 'SEARCH_PRODUCT':
                    // Extract keyword (very basic implementation)
                    const searchTerm = intentData.query.replace(/search|find|looking for|product/gi, '').trim();
                    if (!searchTerm) return { response: "What product are you looking for?" };

                    const products = await Product.find({
                        organizationId: orgId,
                        name: { $regex: searchTerm, $options: 'i' },
                        status: 'active'
                    }).limit(3);

                    if (products.length === 0) return { response: "I couldn't find any products matching that." };

                    const productList = products.map(p => `${p.name} - $${p.price}`).join('\n');
                    return { response: `I found these products:\n${productList}` };

                case 'RETURN_POLICY':
                    return { response: "You can return items within 30 days of receipt. Please contact support to initiate a return." };


                // --- Internal Handlers ---
                case 'CHECK_STOCK':
                    const stockTerm = intentData.query.replace(/check|stock|inventory|for/gi, '').trim();
                    if (!stockTerm) return { response: "Which product's stock do you want to check?" };

                    // Find product first
                    const product = await Product.findOne({ organizationId: orgId, name: { $regex: stockTerm, $options: 'i' } });
                    if (!product) return { response: "Product not found." };

                    const stock = await StockLevel.findOne({ product: product._id, organizationId: orgId });
                    return { response: `${product.name} has ${stock ? stock.quantity : 0} units in stock.` };

                case 'LOW_STOCK_ALERT':
                    const lowStockItems = await StockLevel.find({
                        organizationId: orgId,
                        $expr: { $lte: ["$quantity", "$minStock"] }
                    }).populate('product', 'name');

                    if (lowStockItems.length === 0) return { response: "All stock levels are healthy." };

                    const alertList = lowStockItems.map(s => `${s.product.name}: ${s.quantity}`).join('\n');
                    return { response: `Warning! The following items are low on stock:\n${alertList}` };

                case 'SALES_SUMMARY':
                    // Simple logic: total sales (paid orders)
                    const sales = await Order.aggregate([
                        { $match: { organizationId: new require('mongoose').Types.ObjectId(orgId), paymentStatus: 'completed' } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
                    ]);

                    if (sales.length === 0) return { response: "No completed sales found for this organization." };
                    return { response: `Total Sales: $${sales[0].total.toFixed(2)} (${sales[0].count} orders)` };

                case 'UNKNOWN_INTENT':
                    return { response: "I didn't understand that. Could you try rephrasing?" };

                default:
                    return { response: "I'm not sure how to handle that yet." };
            }
        } catch (error) {
            console.error("Chatbot Error:", error);
            return { response: "Sorry, I encountered an error while processing your request." };
        }
    }
}

module.exports = new ChatbotService();

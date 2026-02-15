const ChatbotService = require('../services/chatbot.service');

const customerChat = async (req, res) => {
    try {
        const { message } = req.body;
        const { customerId, organizationId } = req.customer; // From verifyCustomerToken middleware

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const result = await ChatbotService.processQuery(customerId, 'customer', organizationId, message);

        res.json({
            success: true,
            response: result.response,
            intent: result.intent
        });

    } catch (error) {
        console.error("Customer Chat Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const internalChat = async (req, res) => {
    try {
        const { message } = req.body;
        const { userid, role, organizationId } = req.user; // From verifytoken middleware

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const result = await ChatbotService.processQuery(userid, role, organizationId, message);

        res.json({
            success: true,
            response: result.response,
            intent: result.intent
        });

    } catch (error) {
        console.error("Internal Chat Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    customerChat,
    internalChat
};

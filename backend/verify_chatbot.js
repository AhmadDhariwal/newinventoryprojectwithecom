const mongoose = require('mongoose');
const chatbotService = require('./src/services/chatbot.service');
const User = require('./src/models/user');
const Customer = require('./src/models/customer');
const Organization = require('./src/models/organization');

async function verify() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect('mongodb://localhost:27017/inventorymanagement');
        console.log("Connected.");

        // 1. Get Setup Data
        const admin = await User.findOne({ role: 'admin' });
        const customer = await Customer.findOne({});
        const org = await Organization.findOne({});

        if (!admin || !org) {
            console.error("Missing User or Organization data for test.");
            process.exit(1);
        }

        const adminId = admin._id;
        const orgId = org._id;
        // Use real customer if available, else mock ID
        const customerId = customer ? customer._id : new mongoose.Types.ObjectId();
        const customerOrgId = customer ? customer.organizationId : orgId;

        console.log(`\n--- Testing with Admin (${adminId}) Org (${orgId}) ---`);

        // Test 1: Internal Intent (Sales)
        console.log("\n1. Admin: 'sales today'");
        const res1 = await chatbotService.processQuery(adminId, 'admin', orgId, 'sales today');
        console.log("Response:", JSON.stringify(res1, null, 2));

        // Test 2: Internal Intent (Stock)
        console.log("\n2. Admin: 'check stock'");
        const res2 = await chatbotService.processQuery(adminId, 'admin', orgId, 'check stock');
        console.log("Response:", JSON.stringify(res2, null, 2));

        // Test 3: Admin trying Customer Intent (should fail or be unknown)
        console.log("\n3. Admin: 'track order' (Should be unauthorized/unknown)");
        const res3 = await chatbotService.processQuery(adminId, 'admin', orgId, 'track order');
        console.log("Response:", JSON.stringify(res3, null, 2));


        console.log(`\n--- Testing with Customer (${customerId}) ---`);

        // Test 4: Customer Greeting
        console.log("\n4. Customer: 'hello'");
        const res4 = await chatbotService.processQuery(customerId, 'customer', customerOrgId, 'hello');
        console.log("Response:", JSON.stringify(res4, null, 2));

        // Test 5: Customer Internal Intent (Should fail)
        console.log("\n5. Customer: 'check stock' (Should be unauthorized)");
        const res5 = await chatbotService.processQuery(customerId, 'customer', customerOrgId, 'check stock');
        console.log("Response:", JSON.stringify(res5, null, 2));

        // Test 6: Search
        console.log("\n6. Customer: 'search product'");
        const res6 = await chatbotService.processQuery(customerId, 'customer', customerOrgId, 'search product');
        console.log("Response:", JSON.stringify(res6, null, 2));

        console.log("\nDone.");
        process.exit(0);

    } catch (e) {
        console.error("Verification failed:", e);
        process.exit(1);
    }
}

verify();

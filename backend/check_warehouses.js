const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Warehouse = require('./src/models/warehouse');

// Use the database URL from config or hardcoded for dev env
const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/inventory-app';

mongoose.connect(dbUrl)
    .then(async () => {
        console.log('Connected to ID: ' + dbUrl);
        // The organization ID from environment.ts
        const orgId = '67a1da97f3743477ed05ade1';
        console.log('Checking warehouses for organization:', orgId);

        try {
            const warehouses = await Warehouse.find({ organizationId: orgId });
            console.log('Found warehouses:', JSON.stringify(warehouses, null, 2));

            if (warehouses.length === 0) {
                console.log('No warehouses found. Creating default warehouse...');
                const defaultWarehouse = await Warehouse.create({
                    name: 'Main Warehouse',
                    address: 'Default Address',
                    organizationId: orgId,
                    createdBy: new mongoose.Types.ObjectId(), // Placeholder ID
                    isActive: true
                });
                console.log('Created default warehouse:', defaultWarehouse);
            }
        } catch (err) {
            console.error('Error querying warehouses:', err);
        } finally {
            mongoose.disconnect();
            process.exit();
        }
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

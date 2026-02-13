const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const inventoryschema = require("./src/models/model");
const { connecttomongodb } = require('./connect');
const route = require("./src/routes/route");
const inventoryroute = require("./src/routes/inventory.routes")
const purchaseorderroutes = require("./src/routes/purchaseorder.routes");
const supplierroute = require("./src/routes/supplier.routes");
const salesorderroutes = require("./src/routes/salesorder.routes");
const reportroutes = require("./src/routes/report.routes");
const dashboardroutes = require("./src/routes/dashboard.routes");
const productroutes = require("./src/routes/product.routes");
const warehouseroutes = require("./src/routes/warehouse.routes");
const categoryroutes = require("./src/routes/category.routes");
const businesssettingsroutes = require("./src/routes/businesssettings.routes");
const settingsroutes = require("./src/routes/settings.routes");
const activitylogroutes = require("./src/routes/activitylog.routes");
const organizationroutes = require("./src/routes/organization.routes");
const forecastingroutes = require("./src/routes/forecasting.routes");
const notificationroutes = require("./src/routes/notification.routes");
const ecommerceroutes = require("./src/routes/ecommerce.routes");
const adminorderroutes = require("./src/routes/admin-order.routes");
const cors = require('cors');

const userroute = require('./src/routes/user');
const { verifytoken, restrictto } = require('./src/middleware/auth.middleware');
const { ensureOrganizationContext } = require('./src/middleware/organization.middleware');
const { checkMaintenanceMode } = require('./src/middleware/maintenance.middleware');
const { enforceSecurityPolicies } = require('./src/middleware/security.middleware');




const http = require('http');
const socketUtils = require('./src/utils/socket');

const app = express();
const server = http.createServer(app);
const port = 3000;

//const allowedOrigins = ['*'];

app.use(cors({
  origin: '*',
  credentials: true
}));

// Initialize Socket.io
socketUtils.init(server, '*');

connecttomongodb('mongodb://localhost:27017/inventorymanagement')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes
app.use('/user', userroute);
app.use('/api/organizations', organizationroutes);
app.use('/api/ecommerce', ecommerceroutes);

// Protected routes - require authentication, organization context, and maintenance check
app.use('/items', verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, restrictto(["admin", "user"]), route);
app.use('/api/inventory', verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, inventoryroute);
app.use("/api/suppliers", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, supplierroute);
app.use("/api/purchaseorders", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, purchaseorderroutes);
app.use("/api/salesorders", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, salesorderroutes);
app.use("/api/reports", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, reportroutes);
app.use("/api/dashboard", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, dashboardroutes);
app.use("/api/products", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, productroutes);
app.use("/api/categories", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, categoryroutes);
app.use("/api/warehouses", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, warehouseroutes);
app.use("/api/business-settings", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, businesssettingsroutes); // Settings can be updated even in maintenance mode
app.use("/api/settings", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, settingsroutes);
app.use("/api/activitylog", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, activitylogroutes);
app.use("/api/forecasting", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, forecastingroutes);
app.use("/api/notifications", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, notificationroutes);
app.use("/api/admin/orders", verifytoken, ensureOrganizationContext, enforceSecurityPolicies, checkMaintenanceMode, adminorderroutes);



// app.get('/', (req, res) => {
//   res.send('Hello World'); 
// });

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

server.listen(port, () => console.log(`Server Started at ${port}`));

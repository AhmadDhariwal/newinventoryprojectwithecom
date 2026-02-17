// const express = require("express");
// const router = express.Router();
// const dashboardcontroller = require("../controllers/dashboard.controller");

// router.get("/", dashboardcontroller.getdashboardstats);


// module.exports = router;
const express = require("express");
const router = express.Router();
const controller = require('../controllers/dashboard.controller');

router.get('/', controller.getdashboardstats);
router.get('/stock-trend', controller.getStockTrend);
router.get('/purchase-trend', controller.getPurchaseTrend);
router.get('/sales-trend', controller.getSalesTrend);
router.get('/analytics/order-status', controller.getOrderStatusAnalytics);

module.exports = router;

// const dashboardservice = require("../services/dashboard.service");

// const getdashboardstats = async (req, res) => {
//   try {
//     const stats = await dashboardservice.getDashboardSummary();
//     res.status(200).json(stats);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// module.exports = { getdashboardstats };

const dashboardService = require('../services/dashboard.service');

exports.getdashboardstats = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardSummary(req.user, req.organizationId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStockTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await dashboardService.getStockTrend(days, req.user, req.organizationId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPurchaseTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await dashboardService.getPurchaseTrend(days, req.user, req.organizationId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSalesTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await dashboardService.getSalesTrend(days, req.user, req.organizationId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderStatusAnalytics = async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 7;
    const data = await dashboardService.getOrderStatusAnalytics(range, req.user, req.organizationId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



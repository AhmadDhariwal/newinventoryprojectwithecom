const reportservice = require("../services/report.service");
const stockLevelService = require("../services/stocklevel.service");
const Supplier = require("../models/supplier");

const getstockreport = async (req, res) => {
  try {
    const { organizationId } = req;
    const report = await reportservice.getstockreport(organizationId);
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getstockmovementreport = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const report = await reportservice.getstockmovementreport(organizationId, user);
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportStockMovementsCSV = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const csv = await reportservice.exportStockMovementsCSV({ ...req.query, organizationId }, user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=stock-movements.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportStockMovementsExcel = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const buffer = await reportservice.exportStockMovementsExcel({ ...req.query, organizationId }, user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stock-movements.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportStockSummaryCSV = async (req, res) => {
  try {
    const { organizationId } = req;
    const csv = await reportservice.exportStockSummaryCSV({ ...req.query, organizationId });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=stock-summary.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportStockSummaryExcel = async (req, res) => {
  try {
    const { organizationId } = req;
    const buffer = await reportservice.exportStockSummaryExcel({ ...req.query, organizationId });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stock-summary.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getpurchasereport = async (req, res) => {
  try {
    const { organizationId } = req;
    const report = await reportservice.getpurchasereport(organizationId);
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getallsuppliers = async (req, res) => {
  try {
    const { organizationId } = req;
    const suppliers = await Supplier.find({ organizationId, isActive: true })
      .select('_id name')
      .sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getstocklevelsreport = async (req, res) => {
  try {
    const { organizationId } = req;
    let report = await reportservice.getstocklevelsreport(organizationId);

    // If no stock levels found, initialize them
    if (!report || report.length === 0) {
      console.log('No stock levels found, initializing...');
      await stockLevelService.initializeStockLevels(organizationId);
      report = await reportservice.getstocklevelsreport(organizationId);
    }

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getstocksummary = async (req, res) => {
  try {
    const { organizationId } = req;
    const summary = await reportservice.getstocksummary(organizationId);
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getlowstockreport = async (req, res) => {
  try {
    const { organizationId } = req;
    const report = await reportservice.getlowstockreport(organizationId);
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportPurchaseOrdersCSV = async (req, res) => {
  try {
    const { organizationId } = req;
    const csv = await reportservice.exportPurchaseOrdersCSV({ ...req.query, organizationId });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=purchase-orders.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportPurchaseOrdersExcel = async (req, res) => {
  try {
    const { organizationId } = req;
    const buffer = await reportservice.exportPurchaseOrdersExcel({ ...req.query, organizationId });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=purchase-orders.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getproductreport = async (req, res) => {
  try {
    const { organizationId } = req;
    const { category } = req.query;
    const data = await reportservice.getproductreport(category, organizationId);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product stock report",
      error: error.message
    });
  }
};

module.exports = {
  getstockreport,
  getstockmovementreport,
  exportStockMovementsCSV,
  exportStockMovementsExcel,
  exportStockSummaryCSV,
  exportStockSummaryExcel,
  exportPurchaseOrdersCSV,
  exportPurchaseOrdersExcel,
  getpurchasereport,
  getallsuppliers,
  getstocklevelsreport,
  getlowstockreport,
  getstocksummary,
  getproductreport,
};

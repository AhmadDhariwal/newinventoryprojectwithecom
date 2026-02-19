const businessSettingsService = require("../services/businesssettings.service");

class BusinessSettingsController {
  // GET /api/business-settings
  async getBusinessSettings(req, res) {
    try {
      const { organizationId } = req;
      const settings = await businessSettingsService.getSettings(organizationId);
      res.status(200).json({
        success: true,
        data: settings,
        message: "Business settings retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT /api/business-settings
  async updateBusinessSettings(req, res) {
    try {
      const { organizationId, userid } = req;
      const settings = await businessSettingsService.updateSettings(
        organizationId, 
        req.body, 
        userid, 
        req.ip
      );
      res.status(200).json({
        success: true,
        data: settings,
        message: "Business settings updated successfully"
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/business-settings/company
  async getCompanyInfo(req, res) {
    try {
      const { organizationId } = req;
      const companyInfo = await businessSettingsService.getCompanyInfo(organizationId);
      res.status(200).json({
        success: true,
        data: companyInfo,
        message: "Company information retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/business-settings/regional
  async getRegionalSettings(req, res) {
    try {
      const { organizationId } = req;
      const regionalSettings = await businessSettingsService.getRegionalSettings(organizationId);
      res.status(200).json({
        success: true,
        data: regionalSettings,
        message: "Regional settings retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/business-settings/preferences
  async getBusinessPreferences(req, res) {
    try {
      const { organizationId } = req;
      const preferences = await businessSettingsService.getBusinessPreferences(organizationId);
      res.status(200).json({
        success: true,
        data: preferences,
        message: "Business preferences retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new BusinessSettingsController();
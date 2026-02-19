const BusinessSettings = require("../models/businesssettings");
const Product = require("../models/product");
const { sendNotification } = require("../utils/socket");
const activityLogService = require('./activitylog.service');

class BusinessSettingsService {
  // Get business settings (create default if none exists)
  async getSettings(organizationId) {
    try {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      let settings = await BusinessSettings.findOne({ organizationId });

      // Handle legacy companyName if it exists and organizationName is missing
      if (settings && !settings.organizationName && settings._doc.companyName) {
        settings.organizationName = settings._doc.companyName;
        await settings.save();
      }

      if (!settings) {
        settings = await BusinessSettings.create({
          organizationId,
          organizationName: "Your Organization Name",
          industry: "other",
          currency: "USD",
          timezone: "UTC",
          dateFormat: "MM/DD/YYYY",
          language: "en",
          fiscalYearStart: "01",
          fiscalYearEnd: "12",
          workingDays: "monday-friday",
          defaultTaxRate: 0,
          autoSkuPrefix: 'SKU-',
          maintenanceMode: false,
          enableMultiLocation: false,
          enableTaxCalculation: true,
          enableDiscounts: true,
          defaultTheme: 'light',
          securitySettings: {
            twoFactorEnforced: false,
            passwordExpiryDays: 90,
            sessionTimeout: 60
          }
        });
      }

      return settings;
    } catch (error) {
      throw new Error(`Failed to get business settings: ${error.message}`);
    }
  }

  // Update business settings with application-wide effects
  async updateSettings(organizationId, data, userId = null, userIp = null) {
    try {
      const oldSettings = await BusinessSettings.findOne({ organizationId });
      
      // Use findOneAndUpdate with $set to allow partial updates
      const settings = await BusinessSettings.findOneAndUpdate(
        { organizationId },
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!settings) {
        throw new Error("Settings not found");
      }

      // Apply settings across the application
      await this.applySettingsChanges(organizationId, oldSettings, settings, data);

      // Log activity if user info is provided
      if (userId) {
        await activityLogService.logActivity({
          userId,
          action: 'UPDATE',
          module: 'Business Settings',
          entityId: settings._id,
          entityName: 'Business Settings',
          description: `Updated business settings: ${Object.keys(data).join(', ')}`,
          ip: userIp,
          organizationId
        });
      }

      // Emit real-time update
      sendNotification(organizationId.toString(), 'SETTINGS_UPDATED', {
        settings,
        changedFields: Object.keys(data)
      });

      return settings;
    } catch (error) {
      throw new Error(`Failed to update business settings: ${error.message}`);
    }
  }

  // Apply settings changes across the application
  async applySettingsChanges(organizationId, oldSettings, newSettings, changedData) {
    try {
      // Handle SKU prefix changes
      if (changedData.autoSkuPrefix && oldSettings?.autoSkuPrefix !== newSettings.autoSkuPrefix) {
        await this.updateProductSkuPrefixes(organizationId, oldSettings.autoSkuPrefix, newSettings.autoSkuPrefix);
      }

      // Handle currency changes - could trigger price recalculations
      if (changedData.currency && oldSettings?.currency !== newSettings.currency) {
        // Emit notification for manual price review
        sendNotification(organizationId.toString(), 'CURRENCY_CHANGED', {
          oldCurrency: oldSettings.currency,
          newCurrency: newSettings.currency,
          message: 'Currency changed. Please review product prices and update as needed.'
        });
      }

      // Handle tax calculation toggle
      if (changedData.enableTaxCalculation !== undefined) {
        sendNotification(organizationId.toString(), 'TAX_SETTINGS_CHANGED', {
          enabled: newSettings.enableTaxCalculation,
          defaultRate: newSettings.defaultTaxRate
        });
      }

      // Handle discount toggle
      if (changedData.enableDiscounts !== undefined) {
        sendNotification(organizationId.toString(), 'DISCOUNT_SETTINGS_CHANGED', {
          enabled: newSettings.enableDiscounts
        });
      }

      // Handle maintenance mode
      if (changedData.maintenanceMode !== undefined) {
        sendNotification(organizationId.toString(), 'MAINTENANCE_MODE_CHANGED', {
          enabled: newSettings.maintenanceMode
        });
      }

      // Handle theme changes
      if (changedData.defaultTheme && oldSettings?.defaultTheme !== newSettings.defaultTheme) {
        sendNotification(organizationId.toString(), 'THEME_CHANGED', {
          theme: newSettings.defaultTheme
        });
      }

    } catch (error) {
      console.error('Error applying settings changes:', error);
      // Don't throw here to avoid breaking the main update
    }
  }

  // Update product SKU prefixes when autoSkuPrefix changes
  async updateProductSkuPrefixes(organizationId, oldPrefix, newPrefix) {
    try {
      if (!oldPrefix || !newPrefix || oldPrefix === newPrefix) return;

      const products = await Product.find({ 
        organizationId,
        sku: { $regex: `^${oldPrefix}` }
      });

      const bulkOps = products.map(product => ({
        updateOne: {
          filter: { _id: product._id },
          update: { 
            $set: { 
              sku: product.sku.replace(oldPrefix, newPrefix) 
            } 
          }
        }
      }));

      if (bulkOps.length > 0) {
        await Product.bulkWrite(bulkOps);
        console.log(`Updated ${bulkOps.length} product SKUs with new prefix`);
      }
    } catch (error) {
      console.error('Error updating product SKU prefixes:', error);
    }
  }

  // Get company information only
  async getCompanyInfo(organizationId) {
    try {
      const settings = await this.getSettings(organizationId);
      return {
        organizationName: settings.organizationName,
        industry: settings.industry,
        taxId: settings.taxId,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website
      };
    } catch (error) {
      throw new Error(`Failed to get company info: ${error.message}`);
    }
  }

  // Get regional settings only
  async getRegionalSettings(organizationId) {
    try {
      const settings = await this.getSettings(organizationId);
      return {
        currency: settings.currency,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        language: settings.language
      };
    } catch (error) {
      throw new Error(`Failed to get regional settings: ${error.message}`);
    }
  }

  // Get business preferences only
  async getBusinessPreferences(organizationId) {
    try {
      const settings = await this.getSettings(organizationId);
      return {
        fiscalYearStart: settings.fiscalYearStart,
        fiscalYearEnd: settings.fiscalYearEnd,
        workingDays: settings.workingDays,
        defaultTaxRate: settings.defaultTaxRate,
        autoSkuPrefix: settings.autoSkuPrefix,
        enableMultiLocation: settings.enableMultiLocation,
        enableTaxCalculation: settings.enableTaxCalculation,
        enableDiscounts: settings.enableDiscounts
      };
    } catch (error) {
      throw new Error(`Failed to get business preferences: ${error.message}`);
    }
  }
}

module.exports = new BusinessSettingsService();

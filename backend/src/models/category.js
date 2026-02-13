const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },

  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  },
  // Multi-tenant fields
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  }
}, {
  timestamps: true
});

// Compound index: category name unique within organization
categorySchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
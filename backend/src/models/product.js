const express = require('express');
const mongoose = require('mongoose');


const productschema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
  },
  sku: {     //stock keeping unit 
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",

  },
  cost: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discountPrice: {
    type: Number,
    default: null
  },
  discountPercentage: {
    type: Number,
    default: null
  },
  // Inventory management fields
  reorderLevel: {
    type: Number,
    default: 0,
    min: 0,
    description: "Global reorder level for this product"
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0,
    description: "Total reserved quantity across all warehouses"
  },

  images: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  // Review & Rating fields
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  ratingBreakdown: {
    five: { type: Number, default: 0 },
    four: { type: Number, default: 0 },
    three: { type: Number, default: 0 },
    two: { type: Number, default: 0 },
    one: { type: Number, default: 0 }
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
}, { timestamps: true });

// Compound index: SKU unique within organization (not globally)
productschema.index({ organizationId: 1, sku: 1 }, { unique: true });

const product = mongoose.model("product", productschema);

module.exports = product;
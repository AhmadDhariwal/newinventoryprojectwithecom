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

  images: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
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
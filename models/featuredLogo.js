// models/featuredLogo.js
const mongoose = require("../db");
const { Schema, model } = mongoose;

const featuredLogoSchema = new Schema(
  {
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = model("FeaturedLogo", featuredLogoSchema);
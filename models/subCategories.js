// models/SubCategory.js
const mongoose = require("../db");
const { Schema, model } = mongoose;

const subCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bannerImage: {
      type: String, // S3 image URL
      default: null,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

subCategorySchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = model("SubCategory", subCategorySchema);

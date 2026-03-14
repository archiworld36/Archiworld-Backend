// models/SubCategory.js
const mongoose = require("../db");
const { Schema, model } = mongoose;

const subSubCategorySchema = new Schema(
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
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
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

subSubCategorySchema.index({ name: 1, subCategory: 1 }, { unique: true });

module.exports = model("SubSubCategory", subSubCategorySchema);

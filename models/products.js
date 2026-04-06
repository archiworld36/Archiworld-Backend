const mongoose = require("../db");
const { Schema, model, Types } = mongoose;

const sizeSchema = new Schema(
  {
    length: Number,
    width: Number,
    height: Number,
  },
  { _id: false },
);

const priceSchema = new Schema(
  {
    min: Number,
    max: Number,
  },
  { _id: false },
);

const catalogueSchema = new Schema(
  {
    type: { type: String }, // Documentation / CAD Files / BIM Objects
    bannerImage: { type: String },
    pdfFile: { type: String },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    subCategory: {
      type: Types.ObjectId,
      ref: "SubCategory",
    },
    subSubCategory: {
      type: Types.ObjectId,
      ref: "SubSubCategory",
    },
    category: {
      type: Types.ObjectId,
      ref: "Category",
    },
    material: {
      type: Types.ObjectId,
      ref: "Material",
    },
    brand: {
      type: Types.ObjectId,
      ref: "Brand",
    },
    color: [String],
    size: sizeSchema,
    price: priceSchema,
    features: [{ type: String }],
    bannerImage: String,
    images: [{ type: String }],
    featuredProduct: { type: Boolean },
    catalogues: [catalogueSchema],
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "modifiedAt" },
  },
);

module.exports = model("Product", productSchema);

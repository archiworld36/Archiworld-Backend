// models/User.js
const mongoose = require("../db");
const { Schema, model, Types } = mongoose;

const workingScheduleSchema = new Schema(
  {
    days: [{ type: String }],        // ["Monday", "Tuesday"]
    from: { type: String },          // "09:00"
    to: { type: String },            // "18:30"
  },
  { _id: false }
);

const catalogueSchema = new Schema(
  {
    pdf: { type: String },     // stored file path / URL
    banner: { type: String },  // stored image path / URL
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    mobile: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
    modifiedBy: { type: String, required: true },
    address: String,
    state: String,
    city: String,
    serviceState: [{ type: String }], // ["Delhi", "Haryana"] OR ["Pan India"]
    workingSchedule: workingScheduleSchema,
    parentId: { type: Types.ObjectId, ref: "User" },
    parent: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      default: null,
    },
    
    about: { type: String},
    emailVerified: { type: Boolean},
    profileLogo: { type: String },     // image path
    bannerImage: { type: String },     // image path
    catalogues: [catalogueSchema],
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "modifiedAt" },
  }
);

const User = model("User", userSchema);
module.exports = User;

const mongoose = require("../db");
const { Schema, model } = mongoose;

const subscriptionPlanSchema = new Schema(
    {
      name: { type: String, required: true, unique: true },
      amount: { type: Number, required: true },
      priority: { type: Number, required: true, unique: true},
      createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
  );
  
  subscriptionPlanSchema.index({ priority: 1 }, { unique: true });
  
  module.exports = model("SubscriptionPlan", subscriptionPlanSchema);
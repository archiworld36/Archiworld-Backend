const mongoose = require("../db");
const { Schema, model } = mongoose;

const emailOtpSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    otp: { type: Number, required: true },
    verified: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model("EmailOtp", emailOtpSchema);

const mongoose = require("mongoose");

const phoneOtpSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    otp: { type: Number },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PhoneOtp", phoneOtpSchema);
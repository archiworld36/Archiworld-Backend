const mongoose = require("../db");
const { Schema, model } = mongoose;

const contactUsSchema = new Schema(
  {
    enquiryType: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: Number, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = model("ContactUs", contactUsSchema);

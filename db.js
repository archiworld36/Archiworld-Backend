// db.js - MongoDB connection
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Error: MONGO_URI not defined in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI) // no options needed
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

module.exports = mongoose;

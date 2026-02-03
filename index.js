const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.set("trust proxy", true); // Add this line

app.use(
  cors({
    origin: "https://admin.archiworld.in", // Replace '*' with actual origin in production
    credentials: true,
  })
);

// MongoDB connection
require("./db");

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api", authRoutes);
// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.set("trust proxy", true); // Add this line

app.use(
  cors({
    origin: [
      "https://admin.archiworld.in",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://3.108.61.216",
      "http://archiworld.in",
      "https://archiworld.in",
      "https://demo.archiworld.in",
    ], // Replace '*' with actual origin in production
    credentials: true,
  }),
);

// MongoDB connection
require("./db");

// Routes
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subCategoryRoutes = require("./routes/subCategoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const materialRoutes = require("./routes/materialRoutes");
const productRoutes = require("./routes/productRoutes");

app.use("/api", authRoutes);
app.use("/api", categoryRoutes);
app.use("/api", subCategoryRoutes);
app.use("/api", brandRoutes);
app.use("/api", materialRoutes);
app.use("/api", productRoutes);
// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

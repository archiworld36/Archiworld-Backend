const express = require("express");
const router = express.Router();

const {
  createBrand,
  getBrand,
  updateBrand,
  deleteBrand,
} = require("../controllers/brandsController.js");

const { auth } = require("../middlewares/auth.js");

router.post("/create-brand", auth, createBrand);
router.get("/get-brands", getBrand);
router.put("/update-brand/:id", auth, updateBrand);
router.delete("/delete-brand/:id", auth, deleteBrand);

module.exports = router;

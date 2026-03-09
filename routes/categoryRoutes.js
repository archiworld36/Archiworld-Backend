const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController.js");

const { auth } = require("../middlewares/auth.js");
const { upload } = require("../middlewares/upload.js");

router.post("/create-category", auth, upload.fields([{ name: "bannerImage", maxCount: 1 }]), createCategory)
router.get("/get-categories", getCategory);
router.put("/update-category/:id", auth, upload.fields([{ name: "bannerImage", maxCount: 1 }]), updateCategory);
router.delete("/delete-category/:id", auth, deleteCategory);

module.exports = router;

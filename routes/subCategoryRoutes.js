const express = require("express");
const router = express.Router();

const {
  createSubCategory,
  getSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require("../controllers/subCategoriesController.js");

const { auth } = require("../middlewares/auth.js");
const { upload } = require("../middlewares/upload.js");
router.post(
  "/create-subCategory",
  auth,
  upload.fields([{ name: "bannerImage", maxCount: 1 }]),
  createSubCategory,
);
router.get("/get-subCategories/:categoryId", getSubCategory);
router.put(
  "/update-subCategory/:id",
  auth,
  upload.fields([{ name: "bannerImage", maxCount: 1 }]),
  updateSubCategory,
);
router.delete("/delete-subCategory/:id", auth, deleteSubCategory);

module.exports = router;

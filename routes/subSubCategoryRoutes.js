const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth.js");
const { upload } = require("../middlewares/upload.js");
const {
  createSubSubCategory,
  getSubSubCategory,
  updateSubSubCategory,
  deleteSubSubCategory,
} = require("../controllers/subSubCategoriesController.js");

router.post(
  "/create-sub-subCategory",
  auth,
  upload.fields([{ name: "bannerImage", maxCount: 1 }]),
  createSubSubCategory,
);
router.get("/get-sub-subCategories/:subCategoryId", getSubSubCategory);
router.put(
  "/update-sub-subCategory/:id",
  auth,
  upload.fields([{ name: "bannerImage", maxCount: 1 }]),
  updateSubSubCategory,
);
router.delete("/delete-sub-subCategory/:id", auth, deleteSubSubCategory);

module.exports = router;

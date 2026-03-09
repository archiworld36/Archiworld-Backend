const { uploadStreamToS3 } = require("../config/uploadToS3");
const SubCategory = require("../models/subCategories");

// CREATE
const createSubCategory = async (req, res) => {
  try {
    const { name, categoryId } = req.body;
    const createdUser = req.userId;
    const existingCategory = await SubCategory.findOne({
      name: name.trim(),
      category: categoryId,
    });
    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Sub Category name already exists" });
    }
    let bannerImage = null;

    if (req.files?.bannerImage?.[0]) {
      bannerImage = await uploadStreamToS3(
        req.files.bannerImage[0],
        "categories/banner",
      );
    }
    const subCategory = await SubCategory.create({
      name,
      bannerImage,
      category: categoryId,
      createdBy: createdUser,
    });
    res.status(201).json(subCategory);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Sub-Category name already exists in same category" });
    }
    res.status(400).json({ message: err.message });
  }
};

// READ (by category)
const getSubCategory = async (req, res) => {
  try {
    const subCategories = await SubCategory.find({
      category: req.params.categoryId,
    });
    res.status(201).json(subCategories);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE
const updateSubCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const subCategoryId = req.params.id;

    if (!name) {
      return res.status(400).json({ message: "Sub-Category name is required" });
    }

    // 🔍 Check if name already exists for a DIFFERENT category
    const subCategoryDetails = await SubCategory.findOne({
      _id: subCategoryId,
    });
    const existingCategory = await SubCategory.findOne({
      name: name.trim(),
      category: subCategoryDetails.category,
      _id: { $ne: subCategoryId }, // exclude current category
    });
    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Sub Category name already exists" });
    }
    const updateData = { name: name.trim() };
    if (req.files?.bannerImage?.[0]) {
      updateData.bannerImage = await uploadStreamToS3(
        req.files.bannerImage[0],
        "categories/banner",
      );
    }

    const subCategory = await SubCategory.findByIdAndUpdate(
      subCategoryId,
      updateData,
      { new: true },
    );
    res.status(201).json({ data: subCategory });
  } catch (err) {
    // 🔒 FINAL GUARANTEE
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Sub-category already exists in this category" });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE
const deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById({ _id: req.params.id });
    if (!subCategory) return res.status(404).json({ message: "Not found" });

    await subCategory.deleteOne();
    res.status(201).json({ id: req.params.id, message: "SubCategory deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createSubCategory,
  getSubCategory,
  updateSubCategory,
  deleteSubCategory,
};

const { uploadStreamToS3 } = require("../config/uploadToS3");
const SubSubCategory = require("../models/subSubCategories");
// CREATE
const createSubSubCategory = async (req, res) => {
  try {
    const { name, subCategoryId } = req.body;
    const createdUser = req.userId;

    const existingSubSubCategory = await SubSubCategory.findOne({
      name: name.trim(),
      subCategory: subCategoryId,
    });
    if (existingSubSubCategory) {
      return res
        .status(400)
        .json({ message: "Sub Sub Category name already exists" });
    }
    let bannerImage = null;

    if (req.files?.bannerImage?.[0]) {
      bannerImage = await uploadStreamToS3(
        req.files.bannerImage[0],
        "categories/banner",
      );
    }
    const subSubCategory = await SubSubCategory.create({
      name,
      bannerImage,
      subCategory: subCategoryId,
      createdBy: createdUser,
    });
    res.status(201).json(subSubCategory);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Sub-Sub-Category name already exists in same category",
      });
    }
    res.status(400).json({ message: err.message });
  }
};

// READ (by category)
const getSubSubCategory = async (req, res) => {
  try {
    const subSubCategories = await SubSubCategory.find({
      subCategory: req.params.subCategoryId,
    });
    res.status(201).json(subSubCategories);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE
const updateSubSubCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const subSubCategoryId = req.params.id;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Sub-Sub-Category name is required" });
    }

    // 🔍 Check if name already exists for a DIFFERENT category
    const subSubCategoryDetails = await SubSubCategory.findOne({
      _id: subSubCategoryId,
    });
    const existingSubSubCategory = await SubSubCategory.findOne({
      name: name.trim(),
      subCategory: subSubCategoryDetails.subCategory,
      _id: { $ne: subSubCategoryId }, // exclude current category
    });
    if (existingSubSubCategory) {
      return res
        .status(400)
        .json({ message: "Sub Sub Category name already exists" });
    }
    const updateData = { name: name.trim() };
    if (req.files?.bannerImage?.[0]) {
      updateData.bannerImage = await uploadStreamToS3(
        req.files.bannerImage[0],
        "categories/banner",
      );
    }

    const subSubCategory = await SubSubCategory.findByIdAndUpdate(
      subSubCategoryId,
      updateData,
      { new: true },
    );
    res.status(201).json({ data: subSubCategory });
  } catch (err) {
    // 🔒 FINAL GUARANTEE
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Sub-Sub-category already exists in this category" });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE
const deleteSubSubCategory = async (req, res) => {
  try {
    const subSubCategory = await SubSubCategory.findById({
      _id: req.params.id,
    });
    if (!subSubCategory) return res.status(404).json({ message: "Not found" });

    await subSubCategory.deleteOne();
    res
      .status(201)
      .json({ id: req.params.id, message: "Sub-Sub-Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createSubSubCategory,
  getSubSubCategory,
  updateSubSubCategory,
  deleteSubSubCategory,
};

const { uploadStreamToS3 } = require("../config/uploadToS3");
const Category = require("../models/category");

// CREATE
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const createdUser = req.userId;
    let bannerImage = null;

    if (req.files?.bannerImage?.[0]) {
      bannerImage = await uploadStreamToS3(
        req.files.bannerImage[0],
        "categories/banner",
      );
    }
    const category = await Category.create({
      name,
      createdBy: createdUser,
      bannerImage,
    });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Category name already exists" });
    }
    res.status(400).json({ message: err.message });
  }
};

// READ (list)
const getCategory = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(201).json(categories);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE
const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const categoryId = req.params.id;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // 🔍 Check if name already exists for a DIFFERENT category
    const existingCategory = await Category.findOne({
      name: name.trim(),
      _id: { $ne: categoryId }, // exclude current category
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    const updateData = { name: name.trim() };

    if (req.files?.bannerImage?.[0]) {
      updateData.bannerImage = await uploadStreamToS3(
        req.files.bannerImage[0],
        "categories/banner",
      );
    }
    const category = await Category.findByIdAndUpdate(categoryId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ data: category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE (cascade subcategories)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById({ _id: req.params.id });
    if (!category) return res.status(404).json({ message: "Not found" });

    await category.deleteOne();
    res.status(201).json({
      id: req.params.id,
      message: "Category and subcategories deleted",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
};

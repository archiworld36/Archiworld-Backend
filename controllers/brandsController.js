const Brand = require("../models/brands");

// CREATE
const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    const createdUser = req.userId;
    const existingBrand = await Brand.findOne({
      name: name.trim(),
    });
    if (existingBrand) {
      return res.status(400).json({ message: "Brand name already exists" });
    }
    const brand = await Brand.create({
      name,
      createdBy: createdUser,
    });
    res.status(201).json(brand);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Brand name already exists" });
    }
    res.status(400).json({ message: err.message });
  }
};

// READ (by category)
const getBrand = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.status(201).json(brands);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE
const updateBrand = async (req, res) => {
  try {
    const { name } = req.body;
    const brandId = req.params.id;

    if (!name) {
      return res.status(400).json({ message: "Brand name is required" });
    }

    // 🔍 Check if name already exists for a DIFFERENT category
    const brandDetails = await Brand.findOne({
      _id: brandId,
    });
    const existingBrand = await Brand.findOne({
      name: name.trim(),
      _id: { $ne: brandId }, // exclude current brand
    });
    if (existingBrand) {
      return res.status(400).json({ message: "Brand name already exists" });
    }
    const brand = await Brand.findByIdAndUpdate(
      { _id: req.params.id },
      { name: name.trim() },
      { new: true },
    );
    res.status(201).json({ data: brand });
  } catch (err) {
    // 🔒 FINAL GUARANTEE
    if (err.code === 11000) {
      return res.status(400).json({ message: "Brand already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById({ _id: req.params.id });
    if (!brand) return res.status(404).json({ message: "Not found" });

    await brand.deleteOne();
    res.status(201).json({ id: req.params.id, message: "Brand deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createBrand,
  getBrand,
  updateBrand,
  deleteBrand,
};

const Material = require("../models/material");

// CREATE
const createMaterial = async (req, res) => {
  try {
    const { name } = req.body;
    const createdUser = req.userId;
    const existingMaterial = await Material.findOne({
      name: name.trim(),
    });
    if (existingMaterial) {
      return res.status(400).json({ message: "Material name already exists" });
    }
    const material = await Material.create({
      name,
      createdBy: createdUser,
    });
    res.status(201).json(material);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Material name already exists" });
    }
    res.status(400).json({ message: err.message });
  }
};

// READ (by category)
const getMaterial = async (req, res) => {
  try {
    const materials = await Material.find();
    res.status(201).json(materials);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE
const updateMaterial = async (req, res) => {
  try {
    const { name } = req.body;
    const materialId = req.params.id;

    if (!name) {
      return res.status(400).json({ message: "Material name is required" });
    }

    // 🔍 Check if name already exists for a DIFFERENT category
    const materialDetails = await Material.findOne({
      _id: materialId,
    });
    const existingMaterial = await Material.findOne({
      name: name.trim(),
      _id: { $ne: materialId }, // exclude current material
    });
    if (existingMaterial) {
      return res.status(400).json({ message: "Material name already exists" });
    }
    const material = await Material.findByIdAndUpdate(
      { _id: req.params.id },
      { name: name.trim() },
      { new: true },
    );
    res.status(201).json({ data: material });
  } catch (err) {
    // 🔒 FINAL GUARANTEE
    if (err.code === 11000) {
      return res.status(400).json({ message: "Material already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById({ _id: req.params.id });
    if (!material) return res.status(404).json({ message: "Not found" });

    await material.deleteOne();
    res.status(201).json({ id: req.params.id, message: "Material deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createMaterial,
  getMaterial,
  updateMaterial,
  deleteMaterial,
};

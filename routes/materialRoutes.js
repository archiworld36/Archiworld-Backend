const express = require("express");
const router = express.Router();

const {
  createMaterial,
  getMaterial,
  updateMaterial,
  deleteMaterial,
} = require("../controllers/materialController.js");

const { auth } = require("../middlewares/auth.js");

router.post("/create-material", auth, createMaterial);
router.get("/get-materials", getMaterial);
router.put("/update-material/:id", auth, updateMaterial);
router.delete("/delete-material/:id", auth, deleteMaterial);

module.exports = router;

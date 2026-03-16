const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth.js");
const { upload } = require("../middlewares/upload.js");
const {
  createProduct,
  updateProduct,
  getProductsByUserId,
  getProductsByProductId,
  deleteProduct
} = require("../controllers/productsController.js");

router.post(
  "/create-product",
  auth,
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "images", maxCount: 10 },
    { name: "catalogueBanners", maxCount: 20 },
    { name: "cataloguePdfs", maxCount: 20 },
  ]),
  createProduct,
);
router.put(
  "/edit-product/:productId",
  auth,
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "images", maxCount: 10 },
    { name: "catalogueBanners", maxCount: 20 },
    { name: "cataloguePdfs", maxCount: 20 },
  ]),
  updateProduct,
);
router.get("/get-products-by-user-id", auth, getProductsByUserId);
router.get("/get-product/:productId", auth, getProductsByProductId);
router.delete("/delete-product/:productId", auth, deleteProduct)

module.exports = router;

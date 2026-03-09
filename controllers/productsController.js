const { uploadStreamToS3 } = require("../config/uploadToS3");
const Product = require("../models/products");
const { getUserAndDescendantIds } = require("../utils/utils");

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      subCategory,
      category,
      material,
      brand,
      location,
      color,
      size,
      price,
      features,
      catalogues,
    } = req.body;

    const userId = req.userId;

    // -------- PARSE JSON --------
    const parsedColor = color ? JSON.parse(color) : [];
    const parsedSize = size ? JSON.parse(size) : {};
    const parsedPrice = price ? JSON.parse(price) : {};
    const parsedFeatures = features ? JSON.parse(features) : [];
    const parsedCatalogues = catalogues ? JSON.parse(catalogues) : [];

    // -------- BANNER IMAGE --------
    let bannerImage = "";

    if (req.files?.bannerImage?.[0]) {
      bannerImage = await uploadStreamToS3(
        req.files.bannerImage[0],
        "products",
      );
    }

    // -------- PRODUCT IMAGES --------
    const images = [];

    if (req.files?.images?.length) {
      for (const file of req.files.images) {
        const url = await uploadStreamToS3(file, "products");
        images.push(url);
      }
    }

    // -------- CATALOGUES --------
    const catalogueData = [];

    for (let i = 0; i < parsedCatalogues.length; i++) {
      const item = parsedCatalogues[i];

      let banner = "";
      let pdf = "";

      if (req.files?.catalogueBanners?.[i]) {
        banner = await uploadStreamToS3(
          req.files.catalogueBanners[i],
          "catalogues",
        );
      }

      if (req.files?.cataloguePdfs?.[i]) {
        pdf = await uploadStreamToS3(req.files.cataloguePdfs[i], "catalogues");
      }

      catalogueData.push({
        type: item.type,
        bannerImage: banner,
        pdfFile: pdf,
      });
    }

    // -------- CREATE PRODUCT --------
    const product = await Product.create({
      user: userId,
      name,
      description,
      subCategory,
      category,
      material,
      brand,
      location,

      bannerImage,
      images,

      color: parsedColor,
      size: parsedSize,
      price: parsedPrice,
      features: parsedFeatures,

      catalogues: catalogueData,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: err.message,
    });
  }
};

const getProductsByUserId = async (req, res) => {
  try {
    const parentId = req.userId;
    const descendantIds = await getUserAndDescendantIds(parentId);
    const products = await Product.find({
      user: { $in: descendantIds },
    })
      .populate({
        path: "user",
        select: "-password",
        populate: {
          path: "subscription",
        },
      })
      .populate({
        path: "subCategory", // ✅ populate subCategory
      })
      .populate({
        path: "category", // ✅ populate category
      })
      .populate({
        path: "material", // ✅ populate material
      })
      .populate({
        path: "brand", // ✅ populate brand
      })
      .lean();
    res.status(200).json({ products: products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductsByProductId = async (req, res) => {
  try {
    const parentId = req.userId;
    const { productId } = req.params;
    const descendantIds = await getUserAndDescendantIds(parentId);
    const product = await Product.findOne({
      _id: productId,
      user: { $in: descendantIds },
    })
      .populate({
        path: "user",
        select: "-password",
        populate: {
          path: "subscription",
        },
      })
      .populate("category")
      .populate("subCategory")
      .populate("brand")
      .populate("material")
      .lean();
    res.status(200).json({ products: product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const {
      color,
      subCategoryId,
      material,
      brand,
      minLength,
      maxLength,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      minWeight,
      maxWeight,
      location,
    } = req.body;

    const products = await Product.find({})
      .populate({
        path: "user",
        select: "-password",
        populate: {
          path: "subscription",
        },
      })
      .populate({
        path: "subCategory", // ✅ populate subCategory
      })
      .populate({
        path: "category", // ✅ populate category
      })
      .populate({
        path: "material", // ✅ populate material
      })
      .populate({
        path: "brand", // ✅ populate brand
      })
      .lean();

    const filtersExist = color || material || brand || minLength || location;

    const sorted = products.map((product) => {
      let matchScore = 0;

      if (color && product.color === color) matchScore++;
      if (subCategoryId && product.subCategoryId === subCategoryId)
        matchScore++;
      if (material && product.material === material) matchScore++;
      if (brand && product.brand === brand) matchScore++;
      if (location && product.location === location) matchScore++;

      if (minLength && product.length >= minLength) matchScore++;
      if (maxLength && product.length <= maxLength) matchScore++;

      if (minWidth && product.width >= minWidth) matchScore++;
      if (maxWidth && product.width <= maxWidth) matchScore++;

      if (minHeight && product.height >= minHeight) matchScore++;
      if (maxHeight && product.height <= maxHeight) matchScore++;

      if (minWeight && product.weight >= minWeight) matchScore++;
      if (maxWeight && product.weight <= maxWeight) matchScore++;

      return {
        ...product,
        matchScore,
        priority: product.user?.subscription?.priority || 999,
      };
    });

    sorted.sort((a, b) => {
      if (filtersExist) {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore; // higher match first
        }
      }

      return a.priority - b.priority; // lower priority number first
    });

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    const descendantIds = await getUserAndDescendantIds(userId);

    const product = await Product.findOne({
      _id: productId,
      user: { $in: descendantIds },
    });

    if (!product) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const data = { ...req.body };

    // ---------- PARSE JSON ----------
    const safeParse = (value) => {
      try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
      } catch {
        return value;
      }
    };

    if (data.color) data.color = safeParse(data.color);
    if (data.size) data.size = safeParse(data.size);
    if (data.price) data.price = safeParse(data.price);
    if (data.features) data.features = safeParse(data.features);
    const parsedCatalogues = data.catalogues ? JSON.parse(data.catalogues) : [];

    // ---------- BANNER IMAGE ----------
    if (req.files?.bannerImage?.length) {
      const url = await uploadStreamToS3(req.files.bannerImage[0], "products");
      data.bannerImage = url;
    }

    // ---------- PRODUCT IMAGES ----------
    // ---------- PRODUCT IMAGES ----------
    let existingImages = [];

    if (data.existingImages) {
      existingImages = JSON.parse(data.existingImages);
    }

    if (req.files?.images?.length) {
      const uploadedImages = [];

      for (const file of req.files.images) {
        const url = await uploadStreamToS3(file, "products");
        uploadedImages.push(url);
      }

      data.images = [...existingImages, ...uploadedImages];
    } else {
      data.images = existingImages;
    }

    // ---------- CATALOGUES ----------
    let existingCatalogues = parsedCatalogues;
    const catalogueData = [];

    let bannerIndex = 0;
    let pdfIndex = 0;

    for (let i = 0; i < existingCatalogues.length; i++) {
      const item = existingCatalogues[i];

      let banner = item.bannerImage || "";
      let pdf = item.pdfFile || "";

      // upload new banner only if bannerImage empty
      if (!item.bannerImage && req.files?.catalogueBanners?.[bannerIndex]) {
        banner = await uploadStreamToS3(
          req.files.catalogueBanners[bannerIndex],
          "catalogues",
        );
        bannerIndex++;
      }

      // upload new pdf only if pdfFile empty
      if (!item.pdfFile && req.files?.cataloguePdfs?.[pdfIndex]) {
        pdf = await uploadStreamToS3(
          req.files.cataloguePdfs[pdfIndex],
          "catalogues",
        );
        pdfIndex++;
      }

      catalogueData.push({
        type: item.type,
        bannerImage: banner,
        pdfFile: pdf,
      });
    }

    data.catalogues = catalogueData;

    if (parsedCatalogues.length) {
      data.catalogues = catalogueData;
    }

    Object.assign(product, data);

    await product.save();

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const descendantFilter = await getUserAndDescendantIds(userId);

    const product = await Product.findOne({
      _id: id,
      ...descendantFilter,
    });

    if (!product) return res.status(403).json({ message: "Unauthorized" });

    await product.deleteOne();

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductsByUserId,
  getProductsByProductId,
  updateProduct,
  deleteProduct,
};

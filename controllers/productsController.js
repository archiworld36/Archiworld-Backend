const mongoose = require("mongoose");
const { uploadStreamToS3 } = require("../config/uploadToS3");
const Product = require("../models/products");
const { getUserAndDescendantIds } = require("../utils/utils");
const { Types } = require("mongoose");

const toObjectId = (id) => new mongoose.Types.ObjectId(id);
const toObjectIdArray = (arr) => arr.map((id) => new Types.ObjectId(id));

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      subCategory,
      subSubCategory,
      category,
      material,
      brand,
      location,
      color,
      size,
      price,
      features,
      catalogues,
      featuredProduct,
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
      subSubCategory,
      category,
      material,
      brand,
      location,
      featuredProduct,
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

    res.status(200).json({
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
    const { productId } = req.params;

    const descendantIds = await getUserAndDescendantIds(userId);

    const product = await Product.findOne({
      _id: productId,
      user: { $in: descendantIds },
    });

    if (!product) return res.status(403).json({ message: "Unauthorized" });

    await product.deleteOne();

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
        path: "subSubCategory",
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
      .populate("subSubCategory")
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
    let {
      page = 1,
      limit = 24,
      search = "",
      sortBy = "",
      locations,
      category,
      subCategory,
      subCategories,
      subSubCategories,
      brands,
      materials,
      colors,
      minPrice,
      maxPrice,
      minLength,
      maxLength,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
    } = req.body;

    page = parseInt(page);
    limit = parseInt(limit);

    // ✅ helper
    const toArray = (val) =>
      typeof val === "string" ? val.split(",") : val || [];

    locations = toArray(locations);
    subCategories = toArray(subCategories);
    subSubCategories = toArray(subSubCategories);
    brands = toArray(brands);
    materials = toArray(materials);
    colors = toArray(colors);

    // ✅ ignore "Pan India"
    if (locations.includes("Pan India")) {
      locations = [];
    }

    const match = {};

    // 🧩 FILTERS
    if (category) {
      match.category = toObjectId(category);
    }

    if (subCategory) {
      match.subCategory = toObjectId(subCategory);
    }

    if (subCategories.length)
      match.subCategory = { $in: toObjectIdArray(subCategories) };

    if (subSubCategories.length)
      match.subSubCategory = { $in: toObjectIdArray(subSubCategories) };

    if (brands.length) match.brand = { $in: toObjectIdArray(brands) };

    if (materials.length) match.material = { $in: toObjectIdArray(materials) };

    if (colors.length) match.color = { $in: colors };

    // 💰 PRICE FILTER
    if (minPrice || maxPrice) {
      match.$and = match.$and || [];

      if (minPrice && maxPrice) {
        match.$and.push({
          "price.min": { $lte: Number(maxPrice) },
          "price.max": { $gte: Number(minPrice) },
        });
      } else if (minPrice) {
        match.$and.push({
          "price.max": { $gte: Number(minPrice) },
        });
      } else if (maxPrice) {
        match.$and.push({
          "price.min": { $lte: Number(maxPrice) },
        });
      }
    }

    // 📏 SIZE FILTER
    if (minLength || maxLength) {
      match["size.length"] = {};
      if (minLength) match["size.length"].$gte = Number(minLength);
      if (maxLength) match["size.length"].$lte = Number(maxLength);
    }

    if (minWidth || maxWidth) {
      match["size.width"] = {};
      if (minWidth) match["size.width"].$gte = Number(minWidth);
      if (maxWidth) match["size.width"].$lte = Number(maxWidth);
    }

    if (minHeight || maxHeight) {
      match["size.height"] = {};
      if (minHeight) match["size.height"].$gte = Number(minHeight);
      if (maxHeight) match["size.height"].$lte = Number(maxHeight);
    }

    // 🔽 SORT
    let sort = { createdAt: -1 };

    if (sortBy === "Price: Low to High") {
      sort = { "price.min": 1, "price.max": 1 };
    }

    if (sortBy === "Price: High to Low") {
      sort = { "price.min": -1, "price.max": -1 };
    }

    const searchRegex = search ? new RegExp(search, "i") : null;

    // 🚀 PIPELINE
    const pipeline = [
      { $match: match },

      // 👤 USER (for location)
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      ...(locations.length
        ? [
            {
              $match: {
                "user.state": { $in: locations },
              },
            },
          ]
        : []),

      // 🏷 CATEGORY
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // 🏷 BRAND
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

      // 🏷 MATERIAL
      {
        $lookup: {
          from: "materials",
          localField: "material",
          foreignField: "_id",
          as: "material",
        },
      },
      { $unwind: { path: "$material", preserveNullAndEmptyArrays: true } },

      // 🏷 SUB CATEGORY
      {
        $lookup: {
          from: "subcategories",
          localField: "subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      {
        $unwind: {
          path: "$subCategory",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 🏷 SUB SUB CATEGORY
      {
        $lookup: {
          from: "subsubcategories",
          localField: "subSubCategory",
          foreignField: "_id",
          as: "subSubCategory",
        },
      },
      {
        $unwind: {
          path: "$subSubCategory",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 🔍 GLOBAL SEARCH
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { name: searchRegex },
                  { description: searchRegex },
                  { features: searchRegex },

                  { "category.name": searchRegex },
                  { "brand.name": searchRegex },
                  { "material.name": searchRegex },
                  { "subCategory.name": searchRegex },
                  { "subSubCategory.name": searchRegex },
                ],
              },
            },
          ]
        : []),

      // 🔽 SORT
      { $sort: sort },

      // 📄 PAGINATION
      { $skip: (page - 1) * limit },
      { $limit: limit },

      // 🎯 RESPONSE
      {
        $project: {
          id: "$_id",
          name: 1,
          price: 1,
          bannerImage: 1,
          user: {
            city: "$user.city",
            state: "$user.state",
          },
          category: {
            name: "$category.name",
          },
          brand: {
            name: "$brand.name",
          },
          material: {
            name: "$material.name",
          },
          subCategory: {
            name: "$subCategory.name",
          },
          subSubCategory: {
            name: "$subSubCategory.name",
          },
        },
      },
    ];

    const products = await Product.aggregate(pipeline);

    // 📊 COUNT
    const countPipeline = pipeline.filter(
      (stage) => !stage.$skip && !stage.$limit && !stage.$sort,
    );
    countPipeline.push({ $count: "total" });

    const totalResult = await Product.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    res.json({
      products,
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      featuredProduct: true,
    })
      .select("id name description bannerImage user") // only needed fields
      .populate({
        path: "user",
        select: "id name profileLogo", // only required user fields
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      featuredProducts: products,
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
    });
  }
};

const getProductsDetailsById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({
      _id: productId,
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
      .populate("subSubCategory")
      .populate("brand")
      .populate("material")
      .lean();
    res.status(200).json({ products: product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSuggestedUserProducts = async (req, res) => {
  try {
    const { userId } = req.params;

    const suggestions = await Product.find({ user: userId })
      .populate("user", "city state")
      .populate("category", "name")
      .sort({ featuredProduct: -1, createdAt: -1 }) // ✅ featured first, then latest
      .limit(4); // ✅ only 4 products

    if (!suggestions.length) {
      return res.status(200).json({ suggestedProduct: [] });
    }

    const formatted = suggestions.map((item, i) => ({
      _id: item._id,
      name: item.name,
      user: {
        city: item.user?.city || "",
        state: item.user?.state || "",
      },
      price: item.price,
      category: {
        name: item.category?.name || "",
      },
      bannerImage: item.bannerImage,
    }));

    return res.status(200).json({
      suggestedProduct: formatted,
    });
  } catch (error) {
    console.error("Suggested Products Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getSuggestedProducts = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    // 🔹 1. Get reference product
    const refProduct = await Product.findById(productId);

    if (!refProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    let suggestions = [];
    const addedIds = new Set(); // ✅ track unique products

    // 🔹 Helper function
    const fetchProducts = async (filter, limit) => {
      return await Product.find({
        ...filter,
        _id: { $ne: productId }, // exclude current product
      })
        .limit(limit * 2) // ✅ over-fetch to handle duplicates
        .populate("category", "name")
        .populate("user", "city state");
    };

    // 🔹 Helper to safely push unique products
    const addUniqueProducts = (data) => {
      data.forEach((item) => {
        const id = item._id.toString();

        if (!addedIds.has(id) && suggestions.length < 4) {
          suggestions.push(item);
          addedIds.add(id);
        }
      });
    };

    let remaining = 4;

    // 🔹 1st Preference (most strict)
    if (remaining > 0) {
      const data = await fetchProducts(
        {
          user: refProduct.user,
          category: refProduct.category,
          subCategory: refProduct.subCategory,
          subSubCategory: refProduct.subSubCategory,
        },
        remaining,
      );

      addUniqueProducts(data);
      remaining = 4 - suggestions.length;
    }

    // 🔹 2nd Preference
    if (remaining > 0) {
      const data = await fetchProducts(
        {
          user: refProduct.user,
          category: refProduct.category,
          subCategory: refProduct.subCategory,
        },
        remaining,
      );

      addUniqueProducts(data);
      remaining = 4 - suggestions.length;
    }

    // 🔹 3rd Preference
    if (remaining > 0) {
      const data = await fetchProducts(
        {
          user: refProduct.user,
          category: refProduct.category,
        },
        remaining,
      );

      addUniqueProducts(data);
      remaining = 4 - suggestions.length;
    }

    // 🔹 4th Preference (least strict)
    if (remaining > 0) {
      const data = await fetchProducts(
        {
          user: refProduct.user,
        },
        remaining,
      );

      addUniqueProducts(data);
    }

    // 🔹 If still empty
    if (!suggestions.length) {
      return res.status(200).json({ suggestedProduct: [] });
    }

    // 🔹 Format response
    const formatted = suggestions.map((item, i) => ({
      _id: item._id,
      name: item.name,
      user: {
        city: item.user?.city || "",
        state: item.user?.state || "",
      },
      price: item.price,
      category: {
        name: item.category?.name || "",
      },
      bannerImage: item.bannerImage,
    }));

    return res.status(200).json({
      suggestedProduct: formatted,
    });
  } catch (error) {
    console.error("Suggested Products Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductsByUserId,
  getProductsByProductId,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsDetailsById,
  getSuggestedUserProducts,
  getSuggestedProducts,
};

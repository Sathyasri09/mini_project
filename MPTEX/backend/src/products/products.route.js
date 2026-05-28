const express = require("express");
const Products = require("./products.model");
const Reviews = require("../reviews/reviews.model");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const LOCAL_DATA_PATH = path.join(__dirname, "../data/local_products.json");

// Helper to handle local JSON storage
const getLocalProducts = () => {
  try {
    if (!fs.existsSync(LOCAL_DATA_PATH)) return [];
    const data = fs.readFileSync(LOCAL_DATA_PATH, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Local storage read error:", error);
    return [];
  }
};

const saveLocalProduct = (product) => {
  try {
    const products = getLocalProducts();
    const newProduct = { 
      ...product, 
      _id: `local-${Date.now()}`, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(products, null, 2));
    return newProduct;
  } catch (error) {
    console.error("Local storage save error:", error);
    return null;
  }
};

// post a product
router.post("/create-product", async (req, res) => {
  // DB Failover check
  if (mongoose.connection.readyState !== 1) {
    console.warn("Database disconnected. Using local storage fallback for creation.");
    const savedProduct = saveLocalProduct(req.body);
    if (savedProduct) return res.status(201).send(savedProduct);
    return res.status(500).send({ message: "Failed to create new product in local storage" });
  }

  try {
    const newProduct = new Products({
      ...req.body,
    });

    const savedProduct = await newProduct.save();
    // calculate review
    const reviews = await Reviews.find({ productId: savedProduct._id });
    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;
      savedProduct.rating = averageRating;
      await savedProduct.save();
    }
    res.status(201).send(savedProduct);
  } catch (error) {
    console.error("Error creating new product", error);
    res.status(500).send({ message: "Failed to create new product" });
  }
});

// get all products
router.get("/", async (req, res) => {
  const {
    category,
    color,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
  } = req.query;

  // DB Failover check
  if (mongoose.connection.readyState !== 1) {
    console.warn("Database disconnected. Using local storage fallback for fetching.");
    const allProducts = getLocalProducts();
    const filtered = allProducts.filter(p => {
        if (category && category !== "all" && p.category !== category) return false;
        if (color && color !== "all" && p.color !== color) return false;
        return true;
    });
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = filtered.slice(skip, skip + parseInt(limit));
    return res.status(200).send({ 
        products: paginated, 
        totalPages: Math.ceil(filtered.length / parseInt(limit)), 
        totalProducts: filtered.length 
    });
  }

  try {
    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (color && color !== "all") {
      filter.color = color;
    }

    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && !isNaN(max)) {
        filter.price = { $gte: min, $lte: max };
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalProducts = await Products.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    const products = await Products.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "email")
      .sort({ createdAt: -1 });

    res.status(200).send({ products, totalPages, totalProducts });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send({ message: "Failed to fetch products" });
  }
});

//   get single Product
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Products.findById(productId).populate(
      "author",
      "email username"
    );
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    const reviews = await Reviews.find({ productId }).populate(
      "userId",
      "username email"
    );
    res.status(200).send({ product, reviews });
  } catch (error) {
    console.error("Error fetching the product", error);
    res.status(500).send({ message: "Failed to fetch the product" });
  }
});

// update a product
router.patch(
  "/update-product/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const productId = req.params.id;
      const updatedProduct = await Products.findByIdAndUpdate(
        productId,
        { ...req.body },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).send({ message: "Product not found" });
      }

      res.status(200).send({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating the product", error);
      res.status(500).send({ message: "Failed to update the product" });
    }
  }
);

// delete a product

router.delete("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Products.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).send({ message: "Product not found" });
    }

    // delete reviews related to the product
    await Reviews.deleteMany({ productId: productId });

    res.status(200).send({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting the product", error);
    res.status(500).send({ message: "Failed to delete the product" });
  }
});

// get related products
router.get("/related/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).send({ message: "Product ID is required" });
    }
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    const titleRegex = new RegExp(
      product.name
        .split(" ")
        .filter((word) => word.length > 1)
        .join("|"),
      "i"
    );

    const relatedProducts = await Products.find({
      _id: { $ne: id }, // Exclude the current product
      $or: [
        { name: { $regex: titleRegex } }, // Match similar names
        { category: product.category }, // Match the same category
      ],
    });

    res.status(200).send(relatedProducts);
  } catch (error) {
    console.error("Error fetching the related products", error);
    res.status(500).send({ message: "Failed to fetch related products" });
  }
});

module.exports = router;

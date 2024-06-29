import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
} from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

// Route - /api/v1/product/new
app.post("/new", adminOnly, singleUpload, newProduct);

// to get all products with filters - /api/v1/product/all
app.get("/all", getAllProducts);

// Route - /api/v1/product/latest
app.get("/latest", getLatestProducts);

// Route - /api/v1/product/categories
app.get("/categories", getAllCategories);

// Route - /api/v1/product/admin-products
app.get("/admin-products", adminOnly, getAdminProducts);

// Route to get, update, delete product
app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;

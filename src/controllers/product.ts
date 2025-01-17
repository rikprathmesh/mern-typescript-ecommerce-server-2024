import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQueryType,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
// import { faker } from "@faker-js/faker";
import { nodeCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";

// CREATING NEW PRODUCT
export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please add Photo", 400));

    if (!name || !price || !stock || !category) {
      rm(photo.path, () => {
        console.log("Deleted");
      });

      return next(new ErrorHandler("Please enter All Fields", 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo.path,
    });

    invalidatesCache({ product: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Product Created Successfully",
    });
  }
);

// GET LATEST PRODUCTS
// Revalidate on New, Update, Delete Product & on New Order Placed
export const getLatestProducts = TryCatch(async (req, res, next) => {
  let products;

  if (nodeCache.has("latest-products"))
    products = JSON.parse(nodeCache.get("latest-products") as string);
  else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    nodeCache.set("latest-products", JSON.stringify(products));
  }

  console.log(products, "latest products");

  return res.status(200).json({
    success: true,
    products,
  });
});

// GET ALL CATEGORIES
// Revalidate on New, Update, Delete Product & on New Order Placed
export const getAllCategories = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    let categories;

    if (nodeCache.has("categories"))
      categories = JSON.parse(nodeCache.get("categories") as string);
    else {
      // it provides the unique single category field from Product modal
      categories = await Product.distinct("category");
      nodeCache.set("categories", JSON.stringify(categories));
    }

    return res.status(201).json({
      success: true,
      categories,
    });
  }
);

// Revalidate on New, Update, Delete Product & on New Order Placed
export const getAdminProducts = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    let products;

    if (nodeCache.has("all-products"))
      products = JSON.parse(nodeCache.get("all-products") as string);
    else {
      products = await Product.find({});
      nodeCache.set("all-products", JSON.stringify(products));
    }

    return res.status(201).json({
      success: true,
      products,
    });
  }
);

// GET SINGLE PRODUCT
// Revalidate on New, Update, Delete Product & on New Order Placed
export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;

  const id = req.params.id;

  if (nodeCache.has(`product-${id}`))
    product = JSON.parse(nodeCache.get(`product-${id}`) as string);
  else {
    product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Product Not Found", 404));
    nodeCache.set(`product-${id}`, JSON.stringify(product));
  }
  return res.status(201).json({
    success: true,
    product,
  });
});

// UPDATE PRODUCT
export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  const photo = req.file;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Invalid Product Id", 404));

  if (photo) {
    rm(product.photo, () => {
      console.log("Old Photo Deleted");
    });
    product.photo = photo.path;
    return next(new ErrorHandler("Please enter all fileds", 400));
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;

  await product.save();

  invalidatesCache({product: true, admin: true, productId: String(product._id)})

  return res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
  });
});

// DELETE PRODUCT
export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  rm(product.photo, () => {
    console.log("Product Photo Deleted");
  });

  await product.deleteOne();

  invalidatesCache({product: true, admin: true, productId: String(product._id)})

  return res.status(201).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page || 1);

    const limit = Number(process.env.PRODUCT_PER_PAGE || 8);

    // suppose we are on 2nd page so page = 2
    // 2-1*8 = 8
    // so we have to skip the 8 products which will on 1st page
    const skip = (page - 1) * limit;

    // base query
    const baseQuery: BaseQueryType = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    // we have used two await here
    // its not good practice so for that we use Promise.all
    // using this bothe the await method executed parallaly
    const [products, filteredOnlyProduct] = await Promise.all([
      // to sort product asc or des and added pagination login using limit() and skip()
      productsPromise,
      Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);

    return res.status(201).json({
      success: true,
      products,
      totalPage,
    });
  }
);

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\5ba9bd91-b89c-40c2-bb8a-66703408f986.png",
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);

//   console.log({ succecss: true });
// };

// const deleteRandomsProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({ succecss: true });
// };

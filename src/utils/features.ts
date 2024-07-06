import mongoose, { Document } from "mongoose";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import { nodeCache } from "../app.js";
import { Product } from "../models/product.js";
import { Order } from "../models/order.js";

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Ecommerce_2024",
    })
    .then((res) => console.log(`DB connected to ${res.connection.host}`))
    .catch((err) => console.log(err));
};

// this function is working as clear the cache
export const invalidatesCache = ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
      `product-${productId}`,
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object") {
      productId.forEach((i) => productKeys.push(`product-${i}`));
      console.log("checking the productId type if Array");
    }

    nodeCache.del(productKeys);
  }
  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `orders-${orderId}`,
    ];

    nodeCache.del(orderKeys);
  }
  if (admin) {
    nodeCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ])
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let index = 0; index < orderItems.length; index++) {
    const order = orderItems[index];
    const product = await Product.findById(order.productId);
    if (!product) throw new Error("Product Not Found");
    product.stock = order.quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  // logic to calculate percentage on dashboard
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

// categories count (used in getDashboard and piecharts)
export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );
  console.log(categoriesCountPromise, "categoriesCountPromise");

  const categoriesCount = await Promise.all(categoriesCountPromise);
  console.log(categoriesCount, "categoriesCount");

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });
  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    console.log(creationDate, "creationDate");
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if(property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {

        data[length - monthDiff - 1] += 1;
      }
    }
  });
  return data;
};

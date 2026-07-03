"use server";

import connectDB from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";

/**
 * Fetch all categories for the storefront
 */
export async function getStoreCategories() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 }).lean();
    return { success: true, categories: JSON.parse(JSON.stringify(categories)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load categories." };
  }
}

/**
 * Fetch all products for the storefront
 */
export async function getStoreProducts() {
  try {
    await connectDB();
    const products = await Product.find()
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, products: JSON.parse(JSON.stringify(products)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load products." };
  }
}

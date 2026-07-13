"use server";

import connectDB from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { auth } from "@/auth";

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

/**
 * Record a pending direct storefront checkout order in the database
 */
export async function createStorefrontOrderAction(items: any[], totalPrice: number) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in first." };
    }

    await connectDB();

    const User = (await import("@/models/User")).default;
    const user = await User.findById(session.user.id);
    const walletBalance = user?.walletBalance || 0;
    
    // Wallet credit is stored as a positive number (e.g., 2.5)
    const hasCredit = walletBalance > 0;
    const discount = hasCredit ? Math.min(totalPrice, walletBalance) : 0;
    const finalPrice = Math.max(0, totalPrice - discount);

    const formattedItems = items.map((item) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const order = await Order.create({
      userId: session.user.id,
      items: formattedItems,
      totalPrice: finalPrice,
      walletDiscountApplied: discount,
      status: "PENDING",
      orderType: "STOREFRONT",
    });

    return { success: true, orderId: order._id.toString() };
  } catch (error: any) {
    console.error("Failed to create storefront order:", error);
    return { success: false, error: error.message || "Failed to record order." };
  }
}

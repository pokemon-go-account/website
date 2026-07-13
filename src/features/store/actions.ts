"use server";

import connectDB from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import Order from "@/models/Order";
import PokemonRequest from "@/models/PokemonRequest";
import CustomRequest from "@/models/CustomRequest";
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

/**
 * Record a new custom Pokemon request
 */
export async function createPokemonRequestAction(data: {
  pokemonName: string;
  description: string;
  socialPlatform: string;
  socialId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in first." };
    }

    if (!data.pokemonName || !data.description || !data.socialPlatform || !data.socialId) {
      return { success: false, error: "All fields are required." };
    }

    await connectDB();

    const username = (session.user as any).username || session.user.name || "Unknown";

    // Write to old PokemonRequest model for backwards compatibility
    const request = await PokemonRequest.create({
      userId: session.user.id,
      username,
      email: session.user.email || "No Email",
      pokemonName: data.pokemonName.trim(),
      description: data.description.trim(),
      socialPlatform: data.socialPlatform.trim(),
      socialId: data.socialId.trim(),
      status: "PENDING",
    });

    // Write to unified CustomRequest model
    await CustomRequest.create({
      userId: session.user.id,
      username,
      email: session.user.email || "No Email",
      requestType: "POKEMON",
      title: data.pokemonName.trim(),
      description: data.description.trim(),
      socialPlatform: data.socialPlatform.trim(),
      socialId: data.socialId.trim(),
      status: "PENDING",
    });

    return { success: true, requestId: request._id.toString() };
  } catch (error: any) {
    console.error("Failed to create Pokemon request:", error);
    return { success: false, error: error.message || "Failed to submit request." };
  }
}

/**
 * Record a new custom service request (Account, Stardust, XP)
 */
export async function createCustomRequestAction(data: {
  requestType: "ACCOUNT" | "STARDUST" | "XP";
  title: string;
  description: string;
  socialPlatform: string;
  socialId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in first." };
    }

    if (!data.requestType || !data.title || !data.description || !data.socialPlatform || !data.socialId) {
      return { success: false, error: "All fields are required." };
    }

    await connectDB();

    const username = (session.user as any).username || session.user.name || "Unknown";

    const request = await CustomRequest.create({
      userId: session.user.id,
      username,
      email: session.user.email || "No Email",
      requestType: data.requestType,
      title: data.title.trim(),
      description: data.description.trim(),
      socialPlatform: data.socialPlatform.trim(),
      socialId: data.socialId.trim(),
      status: "PENDING",
    });

    return { success: true, requestId: request._id.toString() };
  } catch (error: any) {
    console.error("Failed to create custom request:", error);
    return { success: false, error: error.message || "Failed to submit request." };
  }
}

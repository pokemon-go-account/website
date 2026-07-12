import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Register Category model to avoid tree-shaking
import { FeaturedStoreClient } from "./featured-store-client";

async function getFeaturedProducts() {
  try {
    await connectDB();
    // Register Category model for population reference
    const _categoryCheck = Category;
    
    const products = await Product.find()
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Failed to load featured storefront items:", error);
    return [];
  }
}

export async function FeaturedStoreItems() {
  const products = await getFeaturedProducts();

  return (
    <section className="bg-gray-50 dark:bg-[#0d0d0f] border-t border-gray-100 dark:border-white/[0.06] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FeaturedStoreClient products={products} />
      </div>
    </section>
  );
}

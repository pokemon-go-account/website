import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Register Category model to avoid tree-shaking
import { FeaturedStoreClient } from "./featured-store-client";

async function getFeaturedProducts() {
  try {
    await connectDB();
    // Register Category model for population reference
    const _categoryCheck = Category;
    
    let products = await Product.find({ isFeatured: true })
      .populate("categoryId", "name slug")
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
      
    if (products.length === 0) {
      products = await Product.find()
        .populate("categoryId", "name slug")
        .sort({ sortOrder: 1, createdAt: -1 })
        .limit(3)
        .lean();
    }
    const now = new Date();
    const processedProducts = products.map((product: any) => {
      if (product.isLimitedDeal && product.dealExpiry && new Date(product.dealExpiry) < now) {
        return {
          ...product,
          isLimitedDeal: false,
          dealExpiry: null,
        };
      }
      return product;
    });

    return JSON.parse(JSON.stringify(processedProducts));
  } catch (error) {
    console.error("Failed to load featured storefront items:", error);
    return [];
  }
}

export async function FeaturedStoreItems() {
  const products = await getFeaturedProducts();

  return (
    <section className="relative w-full overflow-hidden border-t border-zinc-200 dark:border-white/[0.06] py-16">
      <div className="absolute inset-0 bg-white dark:bg-[#09090B] z-[-2] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FeaturedStoreClient products={products} />
      </div>
    </section>
  );
}

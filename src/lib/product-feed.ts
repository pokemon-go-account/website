import connectDB from "@/lib/db";
import Auction from "@/models/Auction";
import Listing from "@/models/Listing";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { getBuyNowPrice, isBuyNowAvailable } from "@/lib/pricing";

export interface ProductFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  price: string; // Formatted as "X.XX USD"
  availability: "in_stock" | "out_of_stock";
  condition: "new" | "used";
}

/**
 * Helper to strip HTML tags and sanitize raw text for feed items.
 */
function stripHtmlTags(htmlStr: string): string {
  if (!htmlStr) return "";
  return htmlStr
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolves the effective selling price for a store product.
 * Uses discountedPrice when a non-expired limited deal is active, otherwise uses price.
 */
function resolveStorePrice(product: {
  price: number;
  discountedPrice: number;
  isLimitedDeal?: boolean;
  dealExpiry?: Date | string | null;
}): number {
  const now = new Date();
  const isActiveDeal =
    product.isLimitedDeal &&
    product.discountedPrice > 0 &&
    (!product.dealExpiry || new Date(product.dealExpiry) > now);
  return isActiveDeal ? product.discountedPrice : product.price;
}

/**
 * Fetches all active eligible auctions AND store products,
 * formatting them as Google Shopping product feed items.
 *
 * - Auction items use condition "used" (second-hand accounts) and are priced at the fixed Buy Now price.
 * - Store product items use condition "new" (services/digital goods) and are always in_stock.
 */
export async function getProductFeedItems(): Promise<ProductFeedItem[]> {
  await connectDB();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : "https://pokemongoservices.com";

  const feedItems: ProductFeedItem[] = [];

  // ── Auctions ──────────────────────────────────────────────────────────────
  try {
    const auctions = await Auction.find({
      status: { $in: ["SCHEDULED", "LIVE"] },
    })
      .populate({ path: "listingId", model: Listing })
      .lean();

    for (const auction of auctions) {
      const listing = auction.listingId as any;
      if (!listing || listing.status !== "APPROVED") continue;

      const startingBid = Number(listing.startingBid) || 0;
      const currentHighestBid = Number(auction.currentHighestBid) || 0;
      const buyNowPrice = getBuyNowPrice(startingBid);
      const buyNowAvailable = isBuyNowAvailable(currentHighestBid, buyNowPrice);

      const availability: "in_stock" | "out_of_stock" = buyNowAvailable ? "in_stock" : "out_of_stock";

      const primaryImage =
        Array.isArray(listing.screenshots) && listing.screenshots.length > 0
          ? listing.screenshots[0]
          : `${baseUrl}/icon.png`;

      const cleanDescription = stripHtmlTags(listing.description || listing.title);

      feedItems.push({
        id: auction._id.toString(),
        title: listing.title,
        description: cleanDescription || listing.title,
        link: `${baseUrl}/auctions/${auction._id.toString()}`,
        imageLink: primaryImage,
        price: `${buyNowPrice.toFixed(2)} USD`,
        availability,
        condition: "used",
      });
    }
  } catch (error) {
    console.error("[getProductFeedItems] Error fetching auction feed items:", error);
  }

  // ── Store Products ─────────────────────────────────────────────────────────
  try {
    const products = await Product.find()
      .populate({ path: "categoryId", model: Category, select: "name slug" })
      .lean();

    for (const product of products as any[]) {
      const category = product.categoryId;
      const effectivePrice = resolveStorePrice(product);

      // Skip products with no valid price
      if (!effectivePrice || effectivePrice <= 0) continue;

      const categorySlug = category?.slug ?? "store";
      const cleanDescription = stripHtmlTags(product.description || product.name);

      feedItems.push({
        // Prefix with "store_" to guarantee no ID collision with auction IDs
        id: `store_${product._id.toString()}`,
        title: product.name,
        description: cleanDescription || product.name,
        link: `${baseUrl}/store/${categorySlug}`,
        imageLink: product.imageUrl || `${baseUrl}/icon.png`,
        price: `${effectivePrice.toFixed(2)} USD`,
        availability: "in_stock",
        condition: "new",
      });
    }
  } catch (error) {
    console.error("[getProductFeedItems] Error fetching store product feed items:", error);
  }

  return feedItems;
}

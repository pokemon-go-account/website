import { NextRequest, NextResponse } from "next/server";
import { getProductFeedItems } from "@/lib/product-feed";

/**
 * INFORMATIONAL ONLY: This JSON endpoint is for internal debugging and platform integrations.
 * Google Merchant Center scheduled fetches REQUIRE the XML route (/feed/products.xml).
 */
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const secret = process.env.PRODUCT_FEED_SECRET;
  const { searchParams } = new URL(request.url);
  const providedKey = searchParams.get("key");

  if (secret && providedKey !== secret) {
    return NextResponse.json({ error: "Forbidden: Invalid secret key" }, { status: 403 });
  }

  const items = await getProductFeedItems();

  return NextResponse.json(items, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getProductFeedItems } from "@/lib/product-feed";

export const revalidate = 3600; // Revalidate XML feed hourly

/**
 * Escapes special XML characters to ensure valid Google Merchant Center RSS feed parsing.
 */
function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: NextRequest) {
  const secret = process.env.PRODUCT_FEED_SECRET;
  const { searchParams } = new URL(request.url);
  const providedKey = searchParams.get("key");

  if (secret && providedKey !== secret) {
    return new NextResponse("Forbidden: Invalid secret key", { status: 403 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : "https://pokemongoservices.com";

  const items = await getProductFeedItems();

  const xmlItems = items
    .map(
      (item) => `    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      <g:title>${escapeXml(item.title)}</g:title>
      <g:description>${escapeXml(item.description)}</g:description>
      <g:link>${escapeXml(item.link)}</g:link>
      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>
      <g:price>${escapeXml(item.price)}</g:price>
      <g:availability>${item.availability}</g:availability>
      <g:condition>${item.condition}</g:condition>
      <g:identifier_exists>false</g:identifier_exists>
    </item>`
    )
    .join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Pokémon GO Services Products</title>
    <link>${baseUrl}</link>
    <description>Google Merchant Center Product Feed for Pokémon GO Accounts and Live Auctions</description>
${xmlItems}
  </channel>
</rss>`;

  return new NextResponse(xmlContent, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

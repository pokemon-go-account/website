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

  if (secret) {
    // Method 1: ?key= query parameter (direct browser / curl access)
    const { searchParams } = new URL(request.url);
    const queryKey = searchParams.get("key");

    // Method 2: HTTP Basic Auth — Google Merchant Center sends credentials this way.
    // The Authorization header is: "Basic base64(username:password)"
    // We use the PASSWORD as the secret (username is ignored).
    let basicAuthKey: string | null = null;
    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader.startsWith("Basic ")) {
      try {
        const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
        basicAuthKey = decoded.split(":").slice(1).join(":"); // everything after first ':'
      } catch {
        // malformed header — leave basicAuthKey as null
      }
    }

    const isAuthenticated = queryKey === secret || basicAuthKey === secret;
    if (!isAuthenticated) {
      return new NextResponse("Forbidden: Invalid secret key", {
        status: 403,
        headers: {
          // Prompt browsers to show a Basic Auth dialog if they hit this directly
          "WWW-Authenticate": 'Basic realm="Product Feed"',
        },
      });
    }
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

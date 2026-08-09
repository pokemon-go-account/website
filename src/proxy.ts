import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth: nextAuthMiddleware } = NextAuth(authConfig);

// The API subdomain serves ONLY the product feed at /products.xml.
// All other paths on this host return 404.
// Both the production host and the local dev equivalent are listed here.
const API_HOSTS = new Set([
  "api.pokemongoservices.com", // production
  "api.localhost",             // local dev (http://api.localhost:3000)
]);

/**
 * Rewrites the clean /products.xml path → /feed/products.xml (the actual Next.js route).
 * Only used on the API subdomain — the /feed/products.xml path is blocked on all other hosts.
 */
function rewriteToFeedRoute(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/feed/products.xml";
  return NextResponse.rewrite(url);
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── api.pokemongoservices.com host guard ──────────────────────────────────
  // Strip port suffix so "api.pokemongoservices.com:3000" (local dev) still matches.
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (API_HOSTS.has(host)) {
    if (pathname === "/products.xml") {
      // Rewrite to the actual feed route — the route handler then applies its own secret-key check.
      return rewriteToFeedRoute(request);
    }
    // Every other path on this host returns a plain 404 — no stack traces, no route info.
    return new NextResponse(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  // ── Main domain / all other hosts — completely unchanged ──────────────────

  // The feed is locked to the API subdomain. Block direct access on the main domain.
  if (pathname === "/feed/products.xml" || pathname === "/products.xml") {
    return new NextResponse(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  // If it's a Next.js Server Action request, bypass the NextAuth middleware
  // to prevent it from altering headers or cookies which Next.js Router relies on.
  if (request.headers.has("next-action")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return (nextAuthMiddleware as any)(request);
}

export const config = {
  matcher: [
    // Explicitly include these extension paths so the middleware fires for them
    // even though the default pattern excludes paths ending in a file extension.
    "/products.xml",
    "/feed/products.xml",
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, except for /api/auth which NextAuth handles)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png, etc.
     * Or any file path with an extension (ends with .[extension])
     */
    "/((?!api(?!/auth)|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};


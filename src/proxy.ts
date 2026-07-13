import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth: nextAuthMiddleware } = NextAuth(authConfig);

export default async function middleware(request: NextRequest) {
  // If it's a Next.js Server Action request, bypass the NextAuth middleware
  // to prevent it from altering headers or cookies which Next.js Router relies on.
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }

  return (nextAuthMiddleware as any)(request);
}

export const config = {
  matcher: [
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

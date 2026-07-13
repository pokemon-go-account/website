import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

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

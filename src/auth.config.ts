import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isPublicRoute = ["/", "/login", "/register"].includes(nextUrl.pathname) || isApiAuthRoute;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isSellerRoute = nextUrl.pathname.startsWith("/dashboard/seller");

      // 1. Let public and API routes pass naturally
      if (isPublicRoute) return true;

      // 2. Route Guards for specific layout protection
      if (isAdminRoute) {
        return isLoggedIn && role === "ADMIN";
      }
      if (isSellerRoute) {
        return isLoggedIn && (role === "SELLER" || role === "ADMIN");
      }

      // 3. Fallback fallback safety gate for standard protected app routes
      return isLoggedIn;
    },
  },
  providers: [], // Initialized with full credentials inside the main auth.ts
} satisfies NextAuthConfig;
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      let activeBaseUrl = baseUrl;
      if (process.env.VERCEL_URL && (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))) {
        activeBaseUrl = `https://${process.env.VERCEL_URL}`;
      }
      
      if (url.startsWith("/")) {
        return `${activeBaseUrl}${url}`;
      }
      try {
        const parsedUrl = new URL(url);
        const parsedBase = new URL(activeBaseUrl);
        if (parsedUrl.origin === parsedBase.origin) {
          return url;
        }
      } catch (e) {
        // Fallback
      }
      return activeBaseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isOnboarded = (user as any).isOnboarded;
      }
      if (trigger === "update" && session) {
        if (session.isOnboarded !== undefined) {
          token.isOnboarded = session.isOnboarded;
        }
        if (session.role) {
          token.role = session.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.role = (token.role as string) || "USER";
        session.user.id = (token.id as string) || "";
        (session.user as any).isOnboarded = !!token.isOnboarded;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isOnboarded = (auth?.user as any)?.isOnboarded;

      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isProfileCompleteRoute = nextUrl.pathname.startsWith("/profile/complete");
      const isPublicRoute = ["/", "/login", "/register"].includes(nextUrl.pathname) || isApiAuthRoute;

      // 1. If logged in but profile is not completed, redirect to /profile/complete
      if (isLoggedIn && !isOnboarded && !isProfileCompleteRoute && !isApiAuthRoute) {
        return Response.redirect(new URL("/profile/complete", nextUrl));
      }

      // 2. Let public, API, and onboarding routes pass naturally
      if (isPublicRoute || isProfileCompleteRoute) return true;

      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isSellerRoute = nextUrl.pathname.startsWith("/dashboard/seller");

      // 3. Route Guards for specific layout protection
      if (isAdminRoute) {
        return isLoggedIn && role === "ADMIN";
      }
      if (isSellerRoute) {
        return isLoggedIn && (role === "SELLER" || role === "ADMIN");
      }

      // 4. Fallback safety gate for standard protected app routes
      return isLoggedIn;
    },
  },
  providers: [], // Initialized with full credentials inside the main auth.ts
} satisfies NextAuthConfig;
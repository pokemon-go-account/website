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
      if (url.startsWith("/")) return `${activeBaseUrl}${url}`;
      try {
        const parsedUrl = new URL(url);
        const parsedBase = new URL(activeBaseUrl);
        if (parsedUrl.origin === parsedBase.origin) return url;
      } catch (_) {}
      return activeBaseUrl;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isOnboarded = (user as any).isOnboarded;
        token.adminRentPaidUntil = (user as any).adminRentPaidUntil ?? null;
      }
      if (trigger === "update" && session) {
        if (session.isOnboarded !== undefined) token.isOnboarded = session.isOnboarded;
        if (session.role) token.role = session.role;
        if (session.adminRentPaidUntil !== undefined) token.adminRentPaidUntil = session.adminRentPaidUntil;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.role = (token.role as string) || "USER";
        session.user.id = (token.id as string) || "";
        (session.user as any).isOnboarded = !!token.isOnboarded;
        (session.user as any).adminRentPaidUntil = token.adminRentPaidUntil ?? null;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role as string | undefined;
      const isOnboarded = (auth?.user as any)?.isOnboarded;
      const adminRentPaidUntil = (auth?.user as any)?.adminRentPaidUntil;

      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isProfileCompleteRoute = nextUrl.pathname.startsWith("/profile/complete");

      // Public routes — never require auth
      const PUBLIC_PREFIXES = ["/auctions", "/store", "/contact", "/feedback", "/recovery"];
      const PUBLIC_EXACT = ["/", "/login", "/register", "/forgot-password"];
      const isPublicRoute =
        PUBLIC_EXACT.includes(nextUrl.pathname) ||
        PUBLIC_PREFIXES.some((p) => nextUrl.pathname.startsWith(p)) ||
        isApiAuthRoute;

      // 1. Redirect un-onboarded users to complete their profile
      if (isLoggedIn && !isOnboarded && !isProfileCompleteRoute && !isApiAuthRoute) {
        return Response.redirect(new URL("/profile/complete", nextUrl));
      }

      // 2. Public routes always pass
      if (isPublicRoute) return true;

      // 3. Onboarding route requires login
      if (isProfileCompleteRoute) {
        if (isLoggedIn) return true;
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }

      // 4. SUPER_ADMIN console — only SUPER_ADMIN
      const isSuperAdminRoute = nextUrl.pathname.startsWith("/console");
      if (isSuperAdminRoute) {
        if (!isLoggedIn) {
          const loginUrl = new URL("/login", nextUrl);
          loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
          return Response.redirect(loginUrl);
        }
        if (role === "SUPER_ADMIN") return true;
        return Response.redirect(new URL("/", nextUrl));
      }

      // 5. ADMIN dashboard — only ADMIN with valid rent, or SUPER_ADMIN
      const isAdminDashRoute = nextUrl.pathname.startsWith("/dashboard/admin");
      if (isAdminDashRoute) {
        if (!isLoggedIn) {
          const loginUrl = new URL("/login", nextUrl);
          loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
          return Response.redirect(loginUrl);
        }
        if (role === "SUPER_ADMIN") return true;
        if (role === "ADMIN") {
          // Check rent validity
          if (!adminRentPaidUntil) return Response.redirect(new URL("/rent-due", nextUrl));
          const rentExpired = new Date(adminRentPaidUntil) < new Date();
          if (rentExpired) return Response.redirect(new URL("/rent-due", nextUrl));
          return true;
        }
        // Logged in but not an admin role → send home
        return Response.redirect(new URL("/", nextUrl));
      }

      // 6. All other protected routes: require login
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
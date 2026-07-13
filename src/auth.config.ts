import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("[Auth Redirect Callback Input]", { url, baseUrl });
      // In production use the canonical domain; in dev always use baseUrl (localhost)
      let canonicalBase =
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : baseUrl)
          : baseUrl;

      // Force HTTPS in production if canonicalBase starts with http:// and is not localhost
      if (process.env.NODE_ENV === "production" && canonicalBase.startsWith("http://") && !canonicalBase.includes("localhost")) {
        canonicalBase = canonicalBase.replace("http://", "https://");
      }

      console.log("[Auth Redirect Callback Canonical]", { canonicalBase });

      const baseClean = canonicalBase.endsWith("/") ? canonicalBase.slice(0, -1) : canonicalBase;

      if (url.startsWith("/")) {
        const res = `${baseClean}${url}`;
        console.log("[Auth Redirect Callback Resolved - relative startsWith]", { res });
        return res;
      }
      try {
        let parsedUrl = new URL(url);
        // Force HTTPS in production for target url if it is not localhost
        if (process.env.NODE_ENV === "production" && parsedUrl.protocol === "http:" && !parsedUrl.hostname.includes("localhost")) {
          parsedUrl.protocol = "https:";
        }

        const parsedBase = new URL(canonicalBase);
        if (parsedUrl.origin === parsedBase.origin) {
          const resUrl = parsedUrl.toString();
          console.log("[Auth Redirect Callback Resolved - matches origin]", { url: resUrl });
          return resUrl;
        }
      } catch (err: any) {
        console.error("[Auth Redirect Callback Error parsedBase/parsedUrl]", err.message);
      }
      console.log("[Auth Redirect Callback Resolved - fallback]", { canonicalBase });
      return canonicalBase;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isOnboarded = (user as any).isOnboarded;
        token.isEmailVerified = (user as any).isEmailVerified;
        token.adminRentPaidUntil = (user as any).adminRentPaidUntil ?? null;
        token.hasPaidVerificationDeposit = (user as any).hasPaidVerificationDeposit;
        token.walletBalance = (user as any).walletBalance;
        token.username = (user as any).username;
      }
      if (trigger === "update" && session) {
        if (session.isOnboarded !== undefined) token.isOnboarded = session.isOnboarded;
        if (session.isEmailVerified !== undefined) token.isEmailVerified = session.isEmailVerified;
        if (session.role) token.role = session.role;
        if (session.adminRentPaidUntil !== undefined) token.adminRentPaidUntil = session.adminRentPaidUntil;
        if (session.hasPaidVerificationDeposit !== undefined) token.hasPaidVerificationDeposit = session.hasPaidVerificationDeposit;
        if (session.walletBalance !== undefined) token.walletBalance = session.walletBalance;
        if (session.username !== undefined) token.username = session.username;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.role = (token.role as string) || "USER";
        session.user.id = (token.id as string) || "";
        (session.user as any).isOnboarded = !!token.isOnboarded;
        (session.user as any).isEmailVerified = !!token.isEmailVerified;
        (session.user as any).adminRentPaidUntil = token.adminRentPaidUntil ?? null;
        (session.user as any).hasPaidVerificationDeposit = !!token.hasPaidVerificationDeposit;
        (session.user as any).walletBalance = Number(token.walletBalance) || 0;
        (session.user as any).username = token.username;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role as string | undefined;
      const isOnboarded = (auth?.user as any)?.isOnboarded;
      const isEmailVerified = (auth?.user as any)?.isEmailVerified;
      const adminRentPaidUntil = (auth?.user as any)?.adminRentPaidUntil;

      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isProfileCompleteRoute = nextUrl.pathname.startsWith("/profile/complete");
      const isVerifyOtpRoute = nextUrl.pathname.startsWith("/verify-otp");

      // Public routes — never require auth
      const PUBLIC_PREFIXES = ["/auctions", "/store", "/contact", "/feedback", "/recovery"];
      const PUBLIC_EXACT = ["/", "/login", "/register", "/forgot-password", "/privacy", "/terms"];
      const isPublicRoute =
        PUBLIC_EXACT.includes(nextUrl.pathname) ||
        PUBLIC_PREFIXES.some((p) => nextUrl.pathname.startsWith(p)) ||
        isApiAuthRoute;

      // 1. Unauthenticated users
      if (!isLoggedIn) {
        if (isPublicRoute) return true;
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }

      // 2. Logged in but email is not verified (Bypassed if ENABLE_EMAIL_VERIFICATION is false)
      const ENABLE_EMAIL_VERIFICATION = false;
      if (ENABLE_EMAIL_VERIFICATION && !isEmailVerified) {
        if (isVerifyOtpRoute || isApiAuthRoute) return true;
        return Response.redirect(new URL("/verify-otp", nextUrl));
      }

      // 3. Logged in and verified, but not onboarded
      if (!isOnboarded) {
        if (isProfileCompleteRoute || isApiAuthRoute) return true;
        return Response.redirect(new URL("/profile/complete", nextUrl));
      }

      // 4. Public routes always pass for logged-in verified users
      if (isPublicRoute) return true;

      // 5. Onboarding/Verification route check (already passed verification/onboarding checks above, send away if trying to visit again)
      if (isVerifyOtpRoute) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // 6. SUPER_ADMIN console — only SUPER_ADMIN
      const isSuperAdminRoute = nextUrl.pathname.startsWith("/console");
      if (isSuperAdminRoute) {
        if (role === "SUPER_ADMIN") return true;
        return Response.redirect(new URL("/", nextUrl));
      }

      // 7. ADMIN dashboard — only ADMIN with valid rent, or SUPER_ADMIN
      const isAdminDashRoute = nextUrl.pathname.startsWith("/dashboard/admin");
      if (isAdminDashRoute) {
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

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
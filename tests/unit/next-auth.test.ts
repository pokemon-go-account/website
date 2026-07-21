import { describe, it, expect } from "vitest";
import { authConfig } from "@/auth.config";

describe("NextAuth Configuration & Routing Filters", () => {
  describe("redirect callback", () => {
    const baseUrl = "http://localhost:3000";

    it("should redirect relative paths correctly", async () => {
      const redirect = authConfig.callbacks.redirect;
      const res = await redirect({ url: "/dashboard", baseUrl });
      expect(res).toBe("http://localhost:3000/dashboard");
    });

    it("should allow redirect to same-origin absolute URL", async () => {
      const redirect = authConfig.callbacks.redirect;
      const res = await redirect({ url: "http://localhost:3000/console/listings", baseUrl });
      expect(res).toBe("http://localhost:3000/console/listings");
    });

    it("should fallback to baseUrl for cross-origin URLs", async () => {
      const redirect = authConfig.callbacks.redirect;
      const res = await redirect({ url: "https://malicious-site.com", baseUrl });
      expect(res).toBe(baseUrl);
    });
  });

  describe("jwt callback", () => {
    it("should copy user database properties to token on sign-in", async () => {
      const jwt = authConfig.callbacks.jwt;
      const mockUser = {
        id: "user123",
        role: "ADMIN" as const,
        isOnboarded: true,
        isEmailVerified: true,
        adminRentPaidUntil: "2026-07-30T10:00:00.000Z",
        hasPaidVerificationDeposit: true,
        walletBalance: 120.5,
        username: "editor_ash",
        country: "US",
      };

      const token = await jwt({ token: {}, user: mockUser as any, trigger: "signIn" });
      expect(token.id).toBe("user123");
      expect(token.role).toBe("ADMIN");
      expect(token.walletBalance).toBe(120.5);
    });

    it("should update token properties when update trigger is called", async () => {
      const jwt = authConfig.callbacks.jwt;
      const initialToken = { id: "user123", role: "USER", walletBalance: 0 };
      const updatedSession = { walletBalance: 50.0 };

      const token = await jwt({
        token: initialToken,
        user: undefined as any,
        trigger: "update",
        session: updatedSession,
      });

      expect(token.walletBalance).toBe(50.0);
      expect(token.id).toBe("user123");
    });
  });

  describe("session callback", () => {
    it("should copy token properties to session user object", async () => {
      const sessionCallback = authConfig.callbacks.session;
      const mockToken = {
        id: "user123",
        role: "SUPER_ADMIN",
        isOnboarded: true,
        isEmailVerified: true,
        walletBalance: 100,
        username: "owner_bill",
        country: "UK",
      };

      const initialSession = { user: {} };
      const sessionObj = await sessionCallback({
        session: initialSession as any,
        token: mockToken as any,
        user: {} as any,
      } as any);

      expect(sessionObj.user.id).toBe("user123");
      expect(sessionObj.user.role).toBe("SUPER_ADMIN");
      expect((sessionObj.user as any).walletBalance).toBe(100);
    });
  });

  describe("authorized route filter middleware", () => {
    const mockNextUrl = (pathname: string) => {
      return new URL(`http://localhost:3000${pathname}`);
    };

    it("should permit unauthenticated visitors on public routes", () => {
      const authorized = authConfig.callbacks.authorized;
      const req = { nextUrl: mockNextUrl("/auctions"), headers: new Map() };

      const res = authorized({ auth: null, request: req as any } as any);
      expect(res).toBe(true);
    });

    it("should block unauthenticated visitors on private dashboard paths", () => {
      const authorized = authConfig.callbacks.authorized;
      const req = { nextUrl: mockNextUrl("/dashboard/admin"), headers: new Map() };

      // Under NextAuth, it redirects to login by returning a Response redirect object
      const res = authorized({ auth: null, request: req as any } as any);
      expect(res).toBeInstanceOf(Response);
    });

    it("should restrict /console routes to SUPER_ADMIN only", () => {
      const authorized = authConfig.callbacks.authorized;
      const req = { nextUrl: mockNextUrl("/console/listings"), headers: new Map() };

      // Normal admin -> gets redirected (returns Response)
      let res = authorized({
        auth: { user: { role: "ADMIN", isOnboarded: true, isEmailVerified: true } as any },
        request: req as any,
      } as any);
      expect(res).toBeInstanceOf(Response);

      // Super admin -> allowed (returns true)
      res = authorized({
        auth: { user: { role: "SUPER_ADMIN", isOnboarded: true, isEmailVerified: true } as any },
        request: req as any,
      } as any);
      expect(res).toBe(true);
    });

    it("should restrict admin dashboard to ADMIN/SUPER_ADMIN and verify rent status", () => {
      const authorized = authConfig.callbacks.authorized;
      const req = { nextUrl: mockNextUrl("/dashboard/admin"), headers: new Map() };

      // Admin with expired rent -> gets redirected
      let res = authorized({
        auth: {
          user: {
            role: "ADMIN",
            isOnboarded: true,
            isEmailVerified: true,
            adminRentPaidUntil: new Date(Date.now() - 3600000).toISOString() as any,
          } as any,
        },
        request: req as any,
      } as any);
      expect(res).toBeInstanceOf(Response);

      // Admin with active rent -> allowed
      res = authorized({
        auth: {
          user: {
            role: "ADMIN",
            isOnboarded: true,
            isEmailVerified: true,
            adminRentPaidUntil: new Date(Date.now() + 36000000).toISOString() as any,
          } as any,
        },
        request: req as any,
      } as any);
      expect(res).toBe(true);
    });
  });
});

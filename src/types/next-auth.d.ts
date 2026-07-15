import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
      id?: string;
      isOnboarded?: boolean;
      adminRentPaidUntil?: string | null;
      country?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    isOnboarded?: boolean;
    adminRentPaidUntil?: Date | null;
    country?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    isOnboarded?: boolean;
    adminRentPaidUntil?: string | null;
    country?: string;
  }
}

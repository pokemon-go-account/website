import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
      id?: string;
      isOnboarded?: boolean;
      adminRentPaidUntil?: string | null; // ISO string
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    isOnboarded?: boolean;
    adminRentPaidUntil?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    isOnboarded?: boolean;
    adminRentPaidUntil?: string | null;
  }
}

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

// Optimizes middleware execution bounds by running only on protected routes
export const config = {
  matcher: [
    "/console",
    "/console/:path*",
    "/dashboard/admin",
    "/dashboard/admin/:path*",
    "/profile",
    "/profile/:path*",
    "/orders",
    "/orders/:path*",
    "/verify-otp",
  ],
};
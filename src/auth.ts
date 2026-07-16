import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (credentials?.isFirebase === "true" && credentials?.firebaseUid) {
          // Security: verify this call originated from our server-side loginWithFirebaseIdToken
          // action, not a direct external POST. Without the correct HMAC nobody can forge a session.
          const bridgeSecret = process.env.FIREBASE_AUTH_BRIDGE_SECRET;
          const providedToken = credentials?.firebaseBridgeToken as string | undefined;
          if (!bridgeSecret || !providedToken) return null;

          const expected = createHmac("sha256", bridgeSecret)
            .update(credentials.firebaseUid as string)
            .digest("hex");
          const expectedBuf = Buffer.from(expected, "hex");
          const providedBuf = Buffer.from(providedToken, "hex");
          if (
            expectedBuf.length !== providedBuf.length ||
            !timingSafeEqual(expectedBuf, providedBuf)
          ) {
            console.warn("[Auth] Rejected isFirebase credentials: invalid bridge token");
            return null;
          }

          await connectDB();
          const user = await User.findById(credentials.firebaseUid);
          if (!user) return null;
          if (user.isSuspended) {
            throw new Error("ACCOUNT_SUSPENDED");
          }
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isOnboarded: user.isOnboarded,
            isEmailVerified: user.isEmailVerified,
            adminRentPaidUntil: user.adminRentPaidUntil?.toISOString() ?? null,
            hasPaidVerificationDeposit: user.hasPaidVerificationDeposit,
            walletBalance: user.walletBalance,
            username: user.username,
          } as any;
        }

        const parsedCredentials = loginSchema.safeParse(credentials);
        if (!parsedCredentials.success) return null;

        await connectDB();
        const { email, password } = parsedCredentials.data;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.passwordHash) return null;

        if (user.isSuspended) {
          throw new Error("ACCOUNT_SUSPENDED");
        }

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isOnboarded: user.isOnboarded,
          isEmailVerified: user.isEmailVerified,
          adminRentPaidUntil: user.adminRentPaidUntil?.toISOString() ?? null,
          hasPaidVerificationDeposit: user.hasPaidVerificationDeposit,
          walletBalance: user.walletBalance,
          username: user.username,
        } as any;
      },
    }),
  ],
});
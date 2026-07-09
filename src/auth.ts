import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (credentials?.isFirebase === "true" && credentials?.firebaseUid) {
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
        } as any;
      },
    }),
  ],
});
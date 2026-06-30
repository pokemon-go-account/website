import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "SELLER" | "ADMIN";
    } & DefaultSession["user"]
  }

  interface User {
    role?: "USER" | "SELLER" | "ADMIN";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [], // We'll populate credentials configurations in Milestone 2
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "SELLER" | "ADMIN";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
  session: {
    strategy: "jwt",
  },
});
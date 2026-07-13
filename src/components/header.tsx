import { auth } from "@/auth";
import { HeaderClient } from "./header-client";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function Header() {
  const session = await auth();
  let freshBalance = 0;

  if (session?.user?.id) {
    try {
      await connectDB();
      const dbUser = await User.findById(session.user.id).select("walletBalance").lean();
      if (dbUser) {
        freshBalance = dbUser.walletBalance ?? 0;
      }
    } catch (err) {
      console.error("Failed to query fresh wallet balance for header:", err);
      freshBalance = (session.user as any).walletBalance ?? 0;
    }
  }

  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: (session.user as any).role as string | undefined,
        walletBalance: freshBalance,
      }
    : undefined;

  console.log("[Header Server Debug] session:", session);
  return <HeaderClient user={user} />;
}

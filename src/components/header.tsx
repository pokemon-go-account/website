import { auth } from "@/auth";
import { HeaderClient } from "./header-client";

export async function Header() {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: (session.user as any).role as string | undefined,
      }
    : undefined;

  console.log("[Header Server Debug] session:", session);
  return <HeaderClient user={user} />;
}

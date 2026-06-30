import { auth, signOut } from "@/auth";
import { HeaderClient } from "./header-client";

export async function Header() {
  const session = await auth();

  // Create a server action to bind next-auth signOut
  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  // Convert role to string if defined, otherwise undefined
  const formattedUser = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || "USER",
      }
    : undefined;

  return <HeaderClient user={formattedUser} signOutAction={signOutAction} />;
}

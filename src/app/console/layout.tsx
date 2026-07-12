import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ConsoleLayoutClient } from "./layout-client";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return (
    <ConsoleLayoutClient user={session.user}>
      {children}
    </ConsoleLayoutClient>
  );
}

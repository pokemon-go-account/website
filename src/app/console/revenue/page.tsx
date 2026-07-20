import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RevenueClient } from "@/app/console/revenue/revenue-client";

export default async function RevenueConsolePage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return <RevenueClient />;
}

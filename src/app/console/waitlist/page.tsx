import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WaitlistPanel } from "./waitlist-panel";

export default async function WaitlistPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    redirect("/console");
  }
  return <WaitlistPanel />;
}

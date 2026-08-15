import Link from "next/link";
import { HeaderClient } from "@/components/header-client";
import { Footer } from "@/components/footer";
import { ChatWidget } from "@/features/chat/components/chat-widget";
import { ShieldCheck, ArrowRight, ShieldAlert } from "lucide-react";
import { getMaintenanceConfig } from "@/features/console/actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [maintenanceConfig, session, headerList] = await Promise.all([
    getMaintenanceConfig(),
    auth(),
    headers(),
  ]);

  const pathname = headerList.get("x-pathname") || "";
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth-error") ||
    pathname.startsWith("/maintenance");

  const isMaintenanceMode = Boolean(maintenanceConfig.maintenanceMode);
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  // If maintenance mode is ACTIVE and user is NOT an admin (and not visiting an auth route), redirect to /maintenance
  if (isMaintenanceMode && !isAdmin && !isAuthPage) {
    redirect("/maintenance");
  }

  return (
    <>
      {/* Admin Notice Banner when Maintenance Mode is Active */}
      {isMaintenanceMode && isAdmin && (
        <div className="w-full bg-amber-500 text-black text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 z-50 sticky top-0">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>⚠️ Maintenance Mode is currently ACTIVE for visitors. You are viewing as an Admin.</span>
          <Link
            href="/console/settings"
            className="underline hover:no-underline font-extrabold ml-1"
          >
            Console Settings →
          </Link>
        </div>
      )}

      {/* Trust Announcement Banner */}
      <div className="w-full bg-gradient-to-r from-purple-900/30 via-zinc-900 to-indigo-900/30 dark:from-[#130d25] dark:via-[#0c0a15] dark:to-[#130d25] border-b border-purple-500/20 text-[11px] sm:text-xs text-zinc-300 py-2 px-4 text-center font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="text-zinc-400 font-semibold">Why Thousands of Pokémon GO Trainers Trust Us</span>
          <Link
            href="/why-trust-us"
            className="inline-flex items-center gap-1 text-white font-bold underline hover:text-purple-300 transition-colors ml-1"
          >
            Read Full Report <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <HeaderClient />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </div>
      <ChatWidget />
    </>
  );
}



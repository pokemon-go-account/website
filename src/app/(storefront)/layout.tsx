import Link from "next/link";
import { HeaderClient } from "@/components/header-client";
import { Footer } from "@/components/footer";
import { ChatWidget } from "@/features/chat/components/chat-widget";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Elegant Beta Announcement Banner */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] sm:text-xs text-zinc-600 dark:text-zinc-400 py-1.5 px-4 text-center font-medium tracking-wide">
        🚀 We are currently in Beta. Welcome to the future of Pokémon GO services!
      </div>

      {/* Trust Announcement Banner */}
      <div className="w-full bg-gradient-to-r from-purple-900/30 via-zinc-900 to-indigo-900/30 dark:from-[#130d25] dark:via-[#0c0a15] dark:to-[#130d25] border-b border-purple-500/20 text-[11px] sm:text-xs text-zinc-300 py-2 px-4 text-center font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="text-zinc-400">Why should you trust us ?</span>
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


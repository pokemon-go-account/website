import { HeaderClient } from "@/components/header-client";
import { Footer } from "@/components/footer";
import { ChatWidget } from "@/features/chat/components/chat-widget";

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
      <div className="w-full bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] sm:text-xs text-zinc-600 dark:text-zinc-400 py-1.5 px-4 text-center font-medium tracking-wide">
        TESTING SITE TESTING SITE TESTING SITE TESTING SITE TESTING SITE TESTING SITE
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

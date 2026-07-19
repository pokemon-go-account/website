import type { Metadata } from "next";
import "@/styles/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/next";
import { ChatWidget } from "@/features/chat/components/chat-widget";
import { PageTransitionLoader } from "@/components/page-transition-loader";
import { PresenceTracker } from "@/components/presence-tracker";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Buy Pokémon GO Accounts & Rare Pokémon | Best Place to Buy PoGo Accounts",
    template: "%s | Pokémon GO Services & Marketplace"
  },
  description: "Best place to buy Pokémon GO accounts, rare shiny Pokémon, Level 40 accounts, Stardust, Mewtwo, and Charizard. Safe escrow, sub-millisecond live auctions, and cheap Pokémon GO store items.",
  keywords: [
    "pokemon go accounts",
    "pokemon go",
    "buy pokemon go accounts",
    "buy pokemon go pokemon",
    "rare pokemon",
    "pokemon accounts",
    "cheap pokemon go accounts",
    "mewtwo pokemon go",
    "buy pokemon go",
    "pokemon go store",
    "buy pokemon account",
    "pokemon go merch",
    "rare pokémon",
    "pokemon go login",
    "pokemon go raids",
    "pokemon go dragonite",
    "best place to buy pokemon go accounts",
    "pokemon go services",
    "best pokemon go account",
    "pokemon go coins",
    "charizard pokemon go",
    "buy stardust pokemon go",
    "best pokemon in pokemon go",
    "snorlax pokemon go",
    "level 40 pokemon go account",
    "purchase pokemon go account",
    "the rarest pokemon",
    "pokemon go pokemon",
    "pokemon go website",
    "shiny pokemon for sale pokemon go",
    "pokemon go shiny",
    "pokemon go balls",
    "buy pokemon go pokemons",
    "buy cheap pokemon go accounts",
    "pokemon raid"
  ],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    title: "Buy Pokémon GO Accounts & Rare Pokémon | Pokémon GO Services & Auctions",
    description: "Your #1 trusted storefront to buy Pokémon GO accounts, shiny legendaries, Level 40 accounts, Stardust, and rare Pokémon with 100% instant escrow delivery.",
    siteName: "Pokémon GO Services & Marketplace",
    images: [
      {
        url: "/og-logo.png",
        width: 1200,
        height: 630,
        alt: "Buy Pokemon GO Accounts & Rare Pokemon Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Cheap Pokémon GO Accounts & Rare Pokémon | PoGo Marketplace",
    description: "Safe & cheap place to buy Pokémon GO accounts, Level 40 accounts, shiny Mewtwo, Dragonite & live auction rooms.",
    images: ["/og-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans dark", plusJakartaSans.variable)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  // Default to dark when no preference is set, or when saved as 'dark'
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col tracking-tight bg-background text-foreground">
        <SessionProvider>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <ChatWidget />
          <PageTransitionLoader />
          <PresenceTracker />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
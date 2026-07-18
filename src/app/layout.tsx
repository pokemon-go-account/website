import type { Metadata } from "next";
import "@/styles/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { auth } from "@/auth";
import { ChatWidget } from "@/features/chat/components/chat-widget";
import { PokemonClickBurst } from "@/components/pokemon-click-burst";
import { PageTransitionLoader } from "@/components/page-transition-loader";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Pokémon GO Services | Premium Accounts, Rare Pokemon & Live Auctions",
    template: "%s | PoGo Services"
  },
  description: "The ultimate destination for elite Pokémon GO players. Explore our massive storefront, bid in real-time live auctions, and access premium rental services.",
  keywords: ["Pokemon Go", "PoGo", "Accounts", "Auctions", "Storefront", "Stardust", "Legendaries", "Services"],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    title: "Pokémon GO Services Hub | Accounts, Items & Live Bidding",
    description: "The ultimate destination for elite Pokémon GO players. Explore our massive storefront, bid in real-time live auctions, and access premium rental services.",
    siteName: "PoGo Services",
    images: [
      {
        url: "/og-logo.png",
        width: 1200,
        height: 630,
        alt: "Pokemon Go Premium Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokémon GO Services Hub | Premium Store & Live Auctions",
    description: "Your #1 destination for elite Pokémon GO accounts, storefront purchases, and real-time bidding.",
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
          {/* <PokemonClickBurst /> */}
          <PageTransitionLoader />
          <AnalyticsTracker />
        </SessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
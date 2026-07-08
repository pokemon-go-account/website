import type { Metadata } from "next";
import "@/styles/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/next";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Pokemon Go Services",
  description: "Secure, real-time scheduled live auctions for high-tier gaming assets.",
  openGraph: {
    title: "Pokemon Go Services",
    description: "Secure, real-time scheduled live auctions for high-tier gaming assets.",
    images: [
      {
        url: "/og-logo.png",
        width: 1200,
        height: 630,
        alt: "Pokemon Go Services Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokemon Go Services",
    description: "Secure, real-time scheduled live auctions for high-tier gaming assets.",
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
          {/* Elegant Beta Announcement Banner */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] sm:text-xs text-zinc-600 dark:text-zinc-400 py-1.5 px-4 text-center font-medium tracking-wide">
            🚀 We are currently in Beta. Welcome to the future of Pokémon GO services!
          </div>
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
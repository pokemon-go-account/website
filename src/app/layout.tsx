import type { Metadata } from "next";
import "@/styles/globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { SessionProvider } from "next-auth/react";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Pokemon Go Auctions",
  description: "Secure, real-time scheduled live auctions for high-tier gaming assets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col tracking-tight bg-background text-foreground">
        <SessionProvider>
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
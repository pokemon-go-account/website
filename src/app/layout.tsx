import type { Metadata } from "next";
import "@/styles/globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Premium Live Asset Auctions",
  description: "Secure, real-time scheduled live auctions for high-tier gaming assets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className="min-h-screen flex flex-col tracking-tight">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
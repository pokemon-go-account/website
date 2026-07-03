import { Hero } from "@/features/landing/components/hero";
import { Features } from "@/features/landing/components/features";
import { FeaturedAuctions } from "@/features/landing/components/featured-auctions";
import { HowItWorks } from "@/features/landing/components/how-it-works";
import { FAQ } from "@/features/landing/components/faq";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#0d0d0f]">
      <Hero />
      <Features />
      <FeaturedAuctions />
      <HowItWorks />
      <FAQ />

      <footer id="contact" className="bg-gray-100 dark:bg-[#080809] border-t border-gray-200 dark:border-white/10 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Pokémon GO Auctions" className="h-10 w-auto object-contain" />
            <div>
              <p className="text-gray-400 dark:text-gray-600 text-[10px] mt-1">© 2026 All rights reserved.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-gray-400">
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact Us</Link>
            <Link href="/auctions" className="hover:text-gray-900 dark:hover:text-white transition-colors">All Auctions</Link>
            <Link href="/dashboard/seller/listings/new" className="hover:text-gray-900 dark:hover:text-white transition-colors">Sell With Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
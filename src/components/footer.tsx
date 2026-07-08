"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer id="contact" className="bg-zinc-100 dark:bg-[#080809] border-t border-zinc-200 dark:border-white/10 py-10 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Pokémon GO Services" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-zinc-400 dark:text-zinc-600 text-[10px] mt-1">© 2026 All rights reserved.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-zinc-400">
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact Us</Link>
          <Link href="/auctions" className="hover:text-zinc-900 dark:hover:text-white transition-colors">All Auctions</Link>
          <Link href="/recovery" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Account Recovery</Link>
          <Link href="/feedback" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Feedback</Link>
        </div>
      </div>
    </footer>
  );
}

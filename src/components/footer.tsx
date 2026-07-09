"use client";

import Link from "next/link";

// Facebook SVG
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.277h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

// Discord SVG
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.93 19.93 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer id="contact" className="bg-zinc-100 dark:bg-[#080809] border-t border-zinc-200 dark:border-white/10 py-10 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
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

        {/* Social / Community Links */}
        <div className="flex items-center justify-center gap-4 pt-1 border-t border-zinc-200 dark:border-white/5">
          <a
            href="https://www.facebook.com/share/1LdWHj4HQz/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-[#1877F2] transition-colors group"
            aria-label="Follow us on Facebook"
          >
            <FacebookIcon className="h-4 w-4 text-zinc-400 group-hover:text-[#1877F2] transition-colors" />
            <span>Facebook</span>
          </a>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <a
            href="https://discord.gg/Zt2yE3qKY"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-[#5865F2] transition-colors group"
            aria-label="Join our Discord server"
          >
            <DiscordIcon className="h-4 w-4 text-zinc-400 group-hover:text-[#5865F2] transition-colors" />
            <span>Discord Community &amp; Support</span>
          </a>
        </div>
      </div>
    </footer>
  );
}


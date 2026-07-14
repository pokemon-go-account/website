"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, ShieldCheck, ChevronRight, MessageSquare, Globe } from "lucide-react";

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
    <footer className="relative bg-zinc-100 dark:bg-[#070709] border-t border-zinc-200 dark:border-white/[0.08] mt-auto">
      {/* Decorative top border gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-[#6133e1] to-purple-600 opacity-80" />

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-zinc-200 dark:border-white/5">
          
          {/* Brand/About Section */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="Pokémon GO Services Logo"
                width={144}
                height={36}
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
              />
              <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                Pokémon GO Services
              </span>
            </Link>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-light max-w-sm">
              The premier marketplace and recovery network for high-tier Pokémon GO assets. Trusted globally for safety, real-time live bidding, and certified trainers.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { name: "Live Auctions", href: "/auctions" },
                { name: "Account Recovery", href: "/recovery" },
                { name: "Feedback Portal", href: "/feedback" },
                { name: "Contact Support", href: "/contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors group"
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#6133e1] dark:text-purple-400 mr-1" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Trust Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { name: "Terms of Service", href: "/terms" },
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Security Protocols", href: "/contact" },
                { name: "FAQ", href: "/#faq" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors group"
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#6133e1] dark:text-purple-400 mr-1" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Support Channels Column */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Direct Contact
            </h4>
            <div className="space-y-3">
              {[
                { label: "Support", email: "support@pokemongoservices.com" },
                { label: "Business", email: "business@pokemongoservices.com" },
                { label: "Info", email: "info@pokemongoservices.com" },
              ].map((channel) => (
                <a
                  key={channel.email}
                  href={`mailto:${channel.email}`}
                  className="flex items-start gap-2.5 p-2 rounded-lg border border-zinc-200 dark:border-white/[0.04] bg-zinc-50 dark:bg-white/[0.01] hover:border-zinc-300 dark:hover:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.03] transition-all group"
                >
                  <Mail className="h-4 w-4 text-zinc-400 group-hover:text-[#6133e1] dark:group-hover:text-purple-400 transition-colors mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase text-zinc-400 dark:text-zinc-550 leading-none mb-0.5">{channel.label}</p>
                    <p className="text-xs font-semibold text-[#6133e1] dark:text-[#a78bfa] truncate group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">{channel.email}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4 text-zinc-400 dark:text-zinc-650 text-[10px] sm:text-xs">
          <p>© {new Date().getFullYear()} Pokémon GO Services. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}

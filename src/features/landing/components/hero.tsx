"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users, Lock, Headphones, Search, X, ArrowRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const trustBadges = [
  { icon: ShieldCheck, label: "100% Secure" },
  { icon: Users, label: "Trusted Community" },
  { icon: Lock, label: "Safe Payments" },
  { icon: Headphones, label: "24/7 Support" },
];

const QUICK_TAGS = [
  { label: "🪙 Coins", query: "coins" },
  { label: "⭐ Level 80", query: "level 80" },
  { label: "⚔️ PVP", query: "pvp" },
  { label: "🐉 Raid Service", query: "raid service" },
  { label: "🏛️ Auction", query: "auction" },
  { label: "✨ Stardust", query: "stardust" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      router.push("/auctions");
    } else {
      router.push(`/auctions?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit(query);
  };

  const handleTagClick = (tagQuery: string) => {
    setQuery(tagQuery);
    handleSubmit(tagQuery);
  };

  return (
    <motion.div variants={itemVariants} className="w-full max-w-md space-y-3">
      {/* Search input */}
      <div
        className={`relative flex items-center rounded-2xl border transition-all duration-200 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md shadow-lg ${
          isFocused
            ? "border-gray-400 dark:border-white/30 shadow-gray-300/40 dark:shadow-white/10 ring-2 ring-gray-900/10 dark:ring-white/10"
            : "border-gray-200/80 dark:border-white/[0.09] shadow-gray-200/50 dark:shadow-black/40"
        }`}
      >
        <Search
          className={`absolute left-4 h-4 w-4 shrink-0 transition-colors duration-200 ${
            isFocused ? "text-gray-700 dark:text-white" : "text-gray-400 dark:text-gray-500"
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Search by team, level, region..."
          className="flex-1 bg-transparent pl-11 pr-10 py-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium focus:outline-none"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-[52px] text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => handleSubmit(query)}
          className="absolute right-2 h-8 w-8 flex items-center justify-center rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-black transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quick suggestion tags */}
      <div className="flex flex-wrap gap-2">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag.query}
            onClick={() => handleTagClick(tag.query)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold border border-gray-200/80 dark:border-white/[0.09] bg-white/70 dark:bg-zinc-900/60 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/30 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 backdrop-blur-sm transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function Hero() {
  const [bgImage, setBgImage] = useState("url('/try.jpg')");

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setBgImage(isDark ? "url('/try.jpg')" : "url('/try.jpg')");
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-transparent">
      {/* Hero Banner Background placed behind particles */}
      <div
        className="absolute inset-0 z-[-2] pointer-events-none"
        style={{
          backgroundImage: bgImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/10 dark:from-[#080809] dark:via-[#080809]/85 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#080809] via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 w-96 h-48 opacity-0 dark:opacity-20 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.1),transparent_70%)]" />
      </div>

      {/* Hero Content Area */}
      <div className="relative min-h-[460px] md:min-h-[580px] flex items-center">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-xl"
          >
            <motion.p
              variants={itemVariants}
              className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-[0.3em] mb-4"
            >
              WELCOME TO
            </motion.p>
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.1] mb-5"
            >
              POKÉMON GO<br />
              <span className="text-gray-900 dark:text-white [text-shadow:0_0_40px_rgba(255,255,255,0.1)]">
                SERVICES
              </span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-7 leading-relaxed max-w-md"
            >
              The ultimate destination for premium Pokémon GO accounts, expert recovery solutions, and high-tier trainer services—secured by our trusted vault.
            </motion.p>

            {/* Search Bar */}
            <HeroSearch />

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-3 mt-6"
            >
              <Link
                href="/auctions"
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-bold px-6 py-3 rounded-xl text-sm transition-all active:scale-95 shadow-lg shadow-black/10 dark:shadow-white/5"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                BROWSE AUCTIONS
              </Link>
              <Link
                href="/store"
                className="inline-flex items-center gap-2 border-2 border-gray-800/20 dark:border-white/30 hover:border-gray-800/60 dark:hover:border-white/60 bg-transparent text-gray-900 dark:text-white hover:bg-gray-100/50 dark:hover:bg-white/5 font-bold px-6 py-3 rounded-xl text-sm transition-all active:scale-95"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" />
                </svg>
                BROWSE SERVICES
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Trust Badges Bar */}
      <div className="relative bg-transparent border-t border-gray-200 dark:border-white/[0.06]">
        <div className="absolute inset-0 bg-gray-50 dark:bg-[#0d0d0f] z-[-2] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 dark:divide-white/[0.06]"
          >
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-center gap-2.5 py-4 px-4">
                <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-semibold">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
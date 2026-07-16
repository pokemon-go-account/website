"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users, Lock, Headphones, Search, X, ArrowRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";

const trustBadges = [
  { icon: ShieldCheck, label: "100% Secure" },
  { icon: Users, label: "Trusted Community" },
  { icon: Lock, label: "Safe Payments" },
  { icon: Headphones, label: "24/7 Support" },
];

const QUICK_TAGS = [
  { label: "🔵 Mystic", query: "mystic" },
  { label: "🔴 Valor", query: "valor" },
  { label: "🟡 Instinct", query: "instinct" },
  { label: "✨ Shiny", query: "shiny" },
  { label: "🏆 Legendary", query: "legendary" },
  { label: "🪙 Coins", query: "coins" },
  { label: "⭐ Level 80", query: "80" },
  { label: "🐉 Raid", query: "raid" },
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
        className={`relative flex items-center rounded-md border transition-all duration-200 bg-white dark:bg-[#111111] ${
          isFocused
            ? "border-zinc-300 dark:border-white/20 shadow-xs"
            : "border-zinc-200 dark:border-white/[0.06]"
        }`}
      >
        <Search
          className={`absolute left-3.5 h-4 w-4 shrink-0 transition-colors duration-200 ${
            isFocused ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"
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
          placeholder="Search team, level, region, shiny, legendary..."
          className="flex-1 bg-transparent pl-10 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 font-semibold focus:outline-none"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-[44px] text-zinc-450 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => handleSubmit(query)}
          className="absolute right-1.5 h-7 w-7 flex items-center justify-center rounded-md bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-all active:scale-[0.98] cursor-pointer"
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
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/10 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function Hero() {

  return (
    <section className="relative w-full overflow-hidden bg-transparent">
      {/* Hero Banner Background placed behind particles */}
      <div className="absolute inset-0 z-[-2] pointer-events-none">
        <Image
          src="/try.jpg"
          alt="Hero background banner"
          fill
          priority
          quality={75}
          sizes="100vw"
          className="object-cover object-center"
        />
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
              className="text-zinc-400 dark:text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-4"
            >
              WELCOME TO
            </motion.p>
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-tight mb-5"
            >
              POKÉMON GO<br />
              <span className="text-zinc-900 dark:text-white">
                SERVICES
              </span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-zinc-550 dark:text-zinc-400 text-xs sm:text-sm mb-7 leading-relaxed max-w-md font-medium"
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
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                BROWSE AUCTIONS
              </Link>
              <Link
                href="/store"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-white/[0.04] bg-transparent text-zinc-850 dark:text-white font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                BROWSE SERVICES
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Trust Badges Bar */}
      <div className="relative bg-transparent border-t border-zinc-200 dark:border-white/[0.06]">
        <div className="absolute inset-0 bg-white dark:bg-[#111111] z-[-2] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-200 dark:divide-white/[0.06]"
          >
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-center gap-2 py-3 px-4">
                <Icon className="h-3.5 w-3.5 text-zinc-450 dark:text-zinc-500 shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
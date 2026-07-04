"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Users, Lock, Headphones } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const trustBadges = [
  { icon: ShieldCheck, label: "100% Secure" },
  { icon: Users, label: "Trusted Community" },
  { icon: Lock, label: "Safe Payments" },
  { icon: Headphones, label: "24/7 Support" },
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

export function Hero() {
  const [bgImage, setBgImage] = useState("url('/hero-banner-light.png')");

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setBgImage(isDark ? "url('/hero-banner-dark.png')" : "url('/hero-banner-light.png')");
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
    <section className="relative w-full overflow-hidden bg-white dark:bg-[#080809]">
      {/* Hero Banner */}
      <div
        className="relative min-h-[460px] md:min-h-[540px] flex items-center"
        style={{
          backgroundImage: bgImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Light mode: bright fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/10 dark:from-[#080809] dark:via-[#080809]/85 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#080809] via-transparent to-transparent opacity-60" />
        {/* Dark mode white ambient glow bottom-left */}
        <div className="absolute bottom-0 left-0 w-96 h-48 opacity-0 dark:opacity-20 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.1),transparent_70%)]" />

        {/* Hero content */}
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
                AUCTIONS
              </span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-8 leading-relaxed max-w-md"
            >
              The trusted marketplace to buy &amp; sell Pokémon GO accounts, rare Pokémon, items and more – through safe and exciting auctions!
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-3"
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
      <div className="bg-gray-50 dark:bg-[#0d0d0f] border-t border-gray-200 dark:border-white/[0.06]">
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
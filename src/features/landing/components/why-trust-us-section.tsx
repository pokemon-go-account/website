"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  MessageCircle,
  Clock,
  Sparkles,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: "100% Buyer & Service Protection",
    description: "Complete protection for storefront orders, live account auctions, and recovery requests with guaranteed delivery or full refund.",
    badge: "100% Guaranteed",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Lock,
    title: "Audited Accounts & Safe Store Products",
    description: "Pre-checked Level 60-80+ accounts, safe stardust top-ups, raid services, and strict credential verification.",
    badge: "Verified Platform",
    color: "text-zinc-900 dark:text-zinc-100",
    bg: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
  },
  {
    icon: RefreshCw,
    title: "Zero Upfront Fee Account Recovery",
    description: "Lost account retrieval & appeal support with ZERO payment required until your account has been successfully recovered.",
    badge: "No Risk Guarantee",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Award,
    title: "28,000+ Orders & 110K+ Community",
    description: "Over 5 years of trusted storefront sales, live account auctions, stardust top-ups, and recovery support.",
    badge: "5★ Rated",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function WhyTrustUsSection() {
  return (
    <section className="relative w-full py-16 overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Transparency & Security First</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Why Thousands of Pokémon GO Trainers Trust Us
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            Over 5+ years of trusted service, 28,000+ completed orders, 15,000+ verified customer vouches, and a 500,000+ member community across Telegram, Facebook, and Discord.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {TRUST_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                variants={itemVariants}
                className="relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#121215] p-6 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${pillar.bg}`}>
                      <Icon className={`h-5 w-5 ${pillar.color}`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified Platform Guarantee</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Featured Report Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl border border-zinc-800 bg-zinc-900 dark:bg-[#121215] p-8 md:p-10 text-white overflow-hidden shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold uppercase tracking-wider">
                  <BookOpen className="h-3.5 w-3.5" />
                  Official Security & Trust Report
                </span>
                <span className="text-zinc-400">• Store • Auctions • Recovery</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Community Verified
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                Why Thousands of Pokémon GO Trainers Trust Us
              </h3>

              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-light">
                Discover our buyer protection safeguards across Storefront Products, Live Auctions, and Zero-Upfront Account Recovery — plus direct access to our 110,000+ trainer community.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                  <MessageCircle className="h-4 w-4 text-cyan-400" />
                  <span>88.2K+ Facebook Community</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>24/7 Priority Support</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:justify-end">
              <Link
                href="/store"
                className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Browse Store</span>
              </Link>
              <Link
                href="/why-trust-us"
                className="w-full lg:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs sm:text-sm transition-all group cursor-pointer"
              >
                <span>Read Full Report</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

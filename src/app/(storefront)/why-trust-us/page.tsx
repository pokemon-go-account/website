"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Mail,
  ArrowRight,
  Sparkles,
  Headphones,
  ShoppingBag,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.277h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const COMMUNITY_CHANNELS = [
  {
    name: "Pokemon Go Community",
    sub: "Facebook Group",
    members: "88.2K members",
    href: "https://www.facebook.com/groups/663972790424791/",
    icon: FacebookIcon,
    brandColor: "text-[#1877F2]",
    borderGlow: "group-hover:border-[#1877F2]/40 group-hover:bg-[#1877F2]/5",
  },
  {
    name: "Pokémon Go Remote Raid & Friend Code",
    sub: "Facebook Group",
    members: "65.8K members",
    href: "https://www.facebook.com/share/g/1HPpDQt9Sj/",
    icon: FacebookIcon,
    brandColor: "text-[#1877F2]",
    borderGlow: "group-hover:border-[#1877F2]/40 group-hover:bg-[#1877F2]/5",
  },
  {
    name: "Pokemon Go Trade and Shiny",
    sub: "Facebook Group",
    members: "24.5K members",
    href: "https://www.facebook.com/groups/178371228350769",
    icon: FacebookIcon,
    brandColor: "text-[#1877F2]",
    borderGlow: "group-hover:border-[#1877F2]/40 group-hover:bg-[#1877F2]/5",
  },
  {
    name: "Telegram Official Channel",
    sub: "@Pokemongoofficialsss",
    members: "Official Group",
    href: "https://t.me/Pokemongoofficialsss",
    icon: TelegramIcon,
    brandColor: "text-[#24A1DE]",
    borderGlow: "group-hover:border-[#24A1DE]/40 group-hover:bg-[#24A1DE]/5",
  },
  {
    name: "Telegram Group",
    sub: "@pokemon_go",
    members: "Official Channel",
    href: "https://t.me/pokemon_go",
    icon: TelegramIcon,
    brandColor: "text-[#24A1DE]",
    borderGlow: "group-hover:border-[#24A1DE]/40 group-hover:bg-[#24A1DE]/5",
  },
  {
    name: "Telegram Group",
    sub: "@PokemonGoAccountss",
    members: "Account Marketplace",
    href: "https://t.me/PokemonGoAccountss",
    icon: TelegramIcon,
    brandColor: "text-[#24A1DE]",
    borderGlow: "group-hover:border-[#24A1DE]/40 group-hover:bg-[#24A1DE]/5",
  },
  {
    name: "Telegram Support Admin",
    sub: "@pokemongoservicesadmin",
    members: "24/7 Direct Channel",
    href: "https://t.me/pokemongoservicesadmin",
    icon: TelegramIcon,
    brandColor: "text-[#24A1DE]",
    borderGlow: "group-hover:border-[#24A1DE]/40 group-hover:bg-[#24A1DE]/5",
  },
];

const EMAIL_CHANNELS = [
  {
    name: "Support Desk",
    email: "support@pokemongoservices.com",
    desc: "Auction disputes, order fulfillment & instant support",
  },
  {
    name: "Business Operations",
    email: "business@pokemongoservices.com",
    desc: "Bulk seller onboarding, partnerships & advertising",
  },
  {
    name: "General Inquiries",
    email: "info@pokemongoservices.com",
    desc: "Platform questions, feature requests & general info",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function WhyTrustUsPage() {
  return (
    <article className="relative min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 py-10 md:py-16 transition-colors overflow-hidden">
      
      {/* Subtle Professional Grid Header Backdrop */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        
        {/* Article Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 pb-8 border-b border-zinc-200/80 dark:border-zinc-800"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Security & Transparency Report
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-500 dark:text-zinc-400">Updated August 2026</span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-500 dark:text-zinc-400">6 min read</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-zinc-900 dark:text-white">
            Why You Should Trust Us: Security Safeguards & Official Community Hub
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
            Whether you are bidding on live account auctions, purchasing direct storefront products & stardust, or requesting zero-upfront account recovery, we guarantee 100% safety, verified delivery, and complete peace of mind.
          </p>

          {/* Author Badge & Action Shortcuts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-sm">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>Pokémon GO Services Security Team</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Verified Platform & Safety Department</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center justify-center">
                <Link
                  href="/store"
                  className="h-9 px-4 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                  <span>Browse Store</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center justify-center">
                <Link
                  href="/auctions"
                  className="h-9 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  <span>Browse Auctions</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Core Trust Statistics Banner */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 shadow-xs text-center"
        >
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all cursor-default"
          >
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">28,000+</p>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Orders Completed</p>
          </motion.div>
          
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="p-3 rounded-xl hover:bg-emerald-500/5 transition-all cursor-default"
          >
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">100%</p>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Buyer Protection</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all cursor-default"
          >
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">110K+</p>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Active Community</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="p-3 rounded-xl hover:bg-amber-500/5 transition-all cursor-default"
          >
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">24/7</p>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Instant Support</p>
          </motion.div>
        </motion.div>

        {/* Article Body Content */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          
          {/* Section 1 */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
          >
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span>1. 100% Protection Across Storefront, Auctions & Account Recovery</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              Whether you purchase a verified Level 60-80+ account, order storefront services (Stardust, Raid Passes, Shiny Hunting), or submit an Account Recovery appeal, every transaction is backed by our strict protection guarantee.
            </p>
            <div className="p-5 rounded-xl bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm space-y-2.5 text-zinc-800 dark:text-zinc-200">
              <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                How Buyer Protection Safeguards Your Order:
              </p>
              <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Storefront Products & Boosting:</strong> Instant catalog delivery for Stardust top-ups, Raid Services, and Shiny Pokémon.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Live Account Auctions:</strong> Verified credential handovers with full access and clean email unlinking.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Account Recovery & Unban Appeals:</strong> ZERO upfront payment required until your account has been successfully recovered.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>24/7 Priority Handover Support:</strong> Dedicated live support team to assist you every step of the way.</span>
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Section 2 */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
          >
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <span>2. Pre-Listing Account Audits & Credential Verification</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              We enforce rigorous verification protocols for every account listed on our live auction house and storefront. Sellers must pass identity and credential checks before listing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181c] space-y-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 dark:text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Stardust & Level Verification</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                  Every account level (e.g. Level 40, Level 50, Level 80) and Stardust reserve is pre-audited.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181c] space-y-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 dark:text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Clean Login Unlinking</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                  We ensure old email and social linkages are unlinked so you have 100% clean full access.
                </p>
              </motion.div>
            </div>
          </motion.section>

          {/* Section 3: Official Community Hub */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="space-y-6 pt-4 border-t border-zinc-200/80 dark:border-zinc-800"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-xs font-bold uppercase tracking-wider">
                <Users className="h-3.5 w-3.5" />
                <span>Transparent Public Presence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                3. Join Our Official Public Communities
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
                Unlike unverified third-party sites, our brand operates openly across large, public Pokémon GO communities. Connect with over 110,000 active trainers, read member feedback, or reach out to our admin team directly:
              </p>
            </div>

            {/* Grid of All Community Channels */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {COMMUNITY_CHANNELS.map((chan) => {
                const Icon = chan.icon;
                return (
                  <motion.a
                    key={chan.name + chan.sub}
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    href={chan.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#121215] transition-all duration-200 group cursor-pointer ${chan.borderGlow}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 ${chan.brandColor} group-hover:scale-105 transition-transform`}>
                        <Icon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors flex items-center gap-1">
                          <span className="truncate">{chan.name}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-zinc-400" />
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {chan.sub}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 shrink-0 ml-2 border border-zinc-200 dark:border-zinc-700">
                      {chan.members}
                    </span>
                  </motion.a>
                );
              })}
            </motion.div>

            {/* Email Channels Box from Contact Page */}
            <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span>Official Support & Inquiry Email Addresses</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EMAIL_CHANNELS.map((item) => (
                  <motion.a
                    key={item.email}
                    whileHover={{ y: -2 }}
                    href={`mailto:${item.email}`}
                    className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181c] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group cursor-pointer block"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{item.name}</p>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-200 truncate">{item.email}</p>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1 font-normal leading-normal">{item.desc}</p>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Section 4 */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
          >
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white shrink-0">
                <Headphones className="h-5 w-5" />
              </div>
              <span>4. 24/7 Support & Instant Response Guarantee</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              Got a question before placing a bid or after completing a purchase? Our dedicated support team operates round the clock. We resolve 98% of inquiries in under 15 minutes through live chat or direct Telegram support.
            </p>
          </motion.section>
        </div>

        {/* CTA & Next Steps Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="p-8 sm:p-10 rounded-2xl bg-zinc-900 dark:bg-[#121215] border border-zinc-800 text-center space-y-5 overflow-hidden shadow-xl"
        >
          <div className="space-y-4">
            <div className="inline-flex p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ready to Browse Verified Pokémon GO Accounts & Services?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed font-light">
              All storefront items, live auctions, and account recovery services are backed by our 100% Buyer Protection guarantee.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center justify-center">
                <Link
                  href="/store"
                  className="h-11 px-5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span>Browse Store Catalog</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center justify-center">
                <Link
                  href="/auctions"
                  className="h-11 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition-all cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
                >
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  <span>Browse Live Auctions</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center justify-center">
                <Link
                  href="/contact"
                  className="h-11 px-5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
                >
                  <Headphones className="h-4 w-4 shrink-0 text-zinc-400" />
                  <span>Contact Support</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ShieldCheck,
  Star,
  Globe,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  MessageSquare,
  Package,
  Heart,
  Award,
  ExternalLink,
  Shield,
  Clock,
  Headphones,
  Check,
} from "lucide-react";

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.277h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TELEGRAM_CHANNELS = [
  {
    title: "Pokémon GO Services Channel",
    members: "27,000+ Members",
    desc: "Marketplace updates, direct account inventory & premium services",
    href: "https://t.me/PokemonGoAccountss",
  },
  {
    title: "Pokémon GO Official Community",
    members: "9,000+ Members",
    desc: "Official discussion, community chat & trainer interactions",
    href: "https://t.me/Pokemongoofficialsss",
  },
  {
    title: "Pokémon GO Events & Updates Channel",
    members: "7,000+ Members",
    desc: "Live game events, raid schedules, nest migrations & news",
    href: "https://t.me/pokemon_go",
  },
];

const FACEBOOK_GROUPS = [
  {
    title: "Pokémon GO Community",
    members: "89,000+ Members",
    href: "https://www.facebook.com/share/g/1DCn4bx8pU/?mibextid=wwXIfr",
  },
  {
    title: "Pokémon GO Trade & Shiny",
    members: "24,000+ Members",
    href: "https://www.facebook.com/share/g/1AUS49KiTN/?mibextid=wwXIfr",
  },
  {
    title: "Pokémon GO Raids & Friend Codes",
    members: "65,000+ Members",
    href: "https://www.facebook.com/share/g/14rMZApVQCx/?mibextid=wwXIfr",
  },
];

const DIFFERENTIATOR_CHECKLIST = [
  "5+ Years of Pokémon GO Experience",
  "28,000+ Successfully Completed Services",
  "15,000+ Verified Customer Vouches",
  "Trusted by Thousands of Trainers Worldwide",
  "500,000+ Combined Community Members",
  "43,000+ Members Across Telegram",
  "178,000+ Members Across Facebook Communities",
  "Partnership with a 150,000+ Member Pokémon GO Discord Community",
  "Fast Customer Support",
  "Honest, Transparent & Reliable Service",
  "Long-Term Presence in the Pokémon GO Community",
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
      
      {/* Background Radial Glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.08),transparent)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        
        {/* Page Header / Hero */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 pb-8 border-b border-zinc-200/80 dark:border-zinc-800"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Trust & Transparency Report
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-500 dark:text-zinc-400">5+ Years Experience</span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-500 dark:text-zinc-400">500,000+ Community</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-zinc-900 dark:text-white">
            Why Thousands of Pokémon GO Trainers Trust Us
          </h1>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500 shrink-0" />
              <span>5+ Years of Trusted Pokémon GO Experience</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              For over 5 years, we’ve proudly served the Pokémon GO community, earning the trust of trainers worldwide through reliable service, honest communication, and consistent customer satisfaction.
            </p>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              We’re not just another Pokémon GO seller. We’re backed by one of the largest Pokémon GO communities, with a combined reach of <strong>500,000+ members</strong> across Telegram, Facebook, and our partnered Discord server.
            </p>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              Over the years, we’ve successfully completed <strong>28,000+ Pokémon GO services</strong> and earned <strong>15,000+ customer vouches</strong>, reflecting the trust and confidence our customers place in us.
            </p>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              From our active communities to thousands of satisfied customers, everything we’ve built reflects our commitment to trust, transparency, and long-term reliability.
            </p>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal font-medium text-zinc-900 dark:text-zinc-100">
              Whether you’re purchasing a Pokémon GO account or using one of our premium services, you can buy with confidence knowing you’re dealing with an experienced and well-established team.
            </p>
          </div>

          {/* Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/store"
                className="h-10 px-5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Browse Accounts & Store</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/auctions"
                className="h-10 px-5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Browse Live Auctions</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <a
                href="https://t.me/Pokemongoofficialsss"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-5 rounded-xl bg-[#24A1DE]/10 hover:bg-[#24A1DE]/20 text-[#24A1DE] border border-[#24A1DE]/30 text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <TelegramIcon />
                <span>Join Official Telegram</span>
              </a>
            </motion.div>
          </div>
        </motion.header>

        {/* Highlight Metrics Bar */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 shadow-xs text-center"
        >
          <motion.div variants={itemVariants} className="p-3 rounded-xl">
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">5+ Years</p>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Experience</p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="p-3 rounded-xl">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">28,000+</p>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Services Completed</p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-3 rounded-xl">
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">15,000+</p>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Customer Vouches</p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-3 rounded-xl">
            <p className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400">500,000+</p>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Combined Reach</p>
          </motion.div>
        </motion.div>

        {/* Section 1: 5+ Years of Experience */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 space-y-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              🛡 5+ Years of Experience
            </h2>
          </div>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
            We’ve been serving the Pokémon GO community for over Five years, helping thousands of trainers with accounts and services.
          </p>

          <div className="p-5 rounded-xl bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800 space-y-3">
            <p className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider">
              Our Experience Means:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Safe and professional service</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Fast responses</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Reliable support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Honest communication</span>
              </li>
              <li className="flex items-center gap-2 sm:col-span-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Long-term commitment to the community</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic border-l-2 border-purple-500 pl-4 py-1">
            "During this time, we’ve successfully completed 28,000+ Pokémon GO services, ranging from account services to premium requests, while maintaining a reputation for quality and reliability."
          </p>
        </motion.section>

        {/* Section 2: Trusted by the Community */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              ⭐️ Trusted by the Community
            </h2>
          </div>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
            Our reputation wasn’t built overnight. Every satisfied customer has helped us grow through recommendations, repeat purchases, and positive feedback.
          </p>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
            Today, we’re proud to have received <strong>15,000+ customer vouches</strong>, showcasing real experiences from trainers who trusted our services.
          </p>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-amber-500" />
            <span>We believe trust is earned—not claimed.</span>
          </div>
        </motion.section>

        {/* Section 3: Large Pokémon GO Communities */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="space-y-6 pt-4 border-t border-zinc-200/80 dark:border-zinc-800"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-cyan-500" />
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                🌍 Large Pokémon GO Communities
              </h2>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              We manage and work with multiple active Pokémon GO communities across different platforms.
            </p>
          </div>

          {/* Telegram Block */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#24A1DE]/10 text-[#24A1DE] border border-[#24A1DE]/30 flex items-center justify-center">
                  <TelegramIcon />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Telegram Network</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Our Telegram network includes 3 core channels</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#24A1DE]/10 text-[#24A1DE] border border-[#24A1DE]/30">
                43,000+ Trainers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {TELEGRAM_CHANNELS.map((chan) => (
                <a
                  key={chan.title}
                  href={chan.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181c] hover:border-[#24A1DE]/50 hover:bg-[#24A1DE]/5 transition-all group block space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#24A1DE] uppercase tracking-wider">{chan.members}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400 group-hover:text-[#24A1DE] transition-colors" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-[#24A1DE] transition-colors">{chan.title}</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-normal">{chan.desc}</p>
                </a>
              ))}
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium text-center pt-1">
              Together, these communities reach <strong>43,000+ Pokémon GO trainers</strong>.
            </p>
          </div>

          {/* Facebook Communities Block */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/30 flex items-center justify-center">
                  <FacebookIcon />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Facebook Communities</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Active Facebook groups managed for Pokémon GO players</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/30">
                178,000+ Trainers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {FACEBOOK_GROUPS.map((group) => (
                <a
                  key={group.title}
                  href={group.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181c] hover:border-[#1877F2]/50 hover:bg-[#1877F2]/5 transition-all group block space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#1877F2] uppercase tracking-wider">{group.members}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400 group-hover:text-[#1877F2] transition-colors" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-[#1877F2] transition-colors">{group.title}</h4>
                </a>
              ))}
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium text-center pt-1">
              Together, our Facebook communities connect <strong>178,000+ Pokémon GO trainers</strong> from around the world.
            </p>
          </div>

          {/* Discord Partnership Block */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/30 flex items-center justify-center shrink-0">
                  <DiscordIcon />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">🤝 Discord Partnership</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/30 uppercase">Partnered</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                    Pokémon GO Coordinates — <span className="text-[#5865F2] font-bold">150,000+ Members</span>
                  </p>
                </div>
              </div>

              <a
                href="https://discord.gg/pogocoordinates"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs"
              >
                <DiscordIcon />
                <span>Join Discord (150K+)</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              We’re also partnered with one of the largest Pokémon GO Discord communities. This partnership helps us stay connected with one of the largest Pokémon GO communities in the world, allowing us to provide better support, stay up to date with the latest game developments, and continue building trust within the global Pokémon GO community.
            </p>
          </div>
        </motion.section>

        {/* Section 4: Real Customer Vouches */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 space-y-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              💬 Real Customer Vouches
            </h2>
          </div>

          <div className="space-y-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
            <p>Transparency is important. That’s why we keep customer feedback and vouches publicly available.</p>
            <p>
              With <strong>15,000+ customer vouches</strong>, new customers can confidently see the experiences of thousands of trainers who have already used our services.
            </p>
            <p>
              Many of our customers return again and recommend us to others because they know they’ll receive exactly what they paid for.
            </p>
          </div>

          
        </motion.section>

        {/* Section 5: What Makes Us Different? */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 space-y-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <Package className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              📦 What Makes Us Different?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DIFFERENTIATOR_CHECKLIST.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181c] border border-zinc-200/70 dark:border-zinc-800 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                <div className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Section 6: Our Promise */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-purple-900/20 via-zinc-900 to-indigo-900/20 dark:from-[#150d2a] dark:via-[#100e19] dark:to-[#150d2a] border border-purple-500/30 space-y-5 text-white shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
              <Heart className="h-6 w-6 fill-purple-400 text-purple-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Our Promise
            </h2>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed font-light">
            <p className="font-semibold text-white">Our goal has always been simple:</p>
            <p className="text-purple-200 font-medium italic border-l-2 border-purple-400 pl-4 py-1">
              "Provide reliable Pokémon GO services with honest communication, fair pricing, and support you can trust."
            </p>
            <p>
              For more than 5 years, we’ve successfully completed <strong>28,000+ services</strong>, earned <strong>15,000+ customer vouches</strong>, and built a <strong>500,000+ member community</strong> across multiple platforms.
            </p>
            <p>
              Whether you’re purchasing an account, using one of our services, or simply joining our community, we’re committed to making your experience smooth, safe, and professional.
            </p>
            <p className="font-medium text-white pt-2">
              Thank you for being part of our journey. We look forward to serving the Pokémon GO community for many more years.
            </p>
          </div>
        </motion.section>

        {/* CTA Card */}
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
              Ready to Buy with Confidence?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed font-light">
              Explore our verified Pokémon GO accounts, live auctions, and premium trainer services backed by 5+ years of community trust.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/store"
                  className="h-11 px-5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span>Browse Store Catalog</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/auctions"
                  className="h-11 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition-all cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
                >
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  <span>Browse Live Auctions</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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

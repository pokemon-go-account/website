"use client";

import { useState } from "react";
import Link from "next/link";
import { joinWaitlist } from "@/features/waitlist/actions";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, TrendingUp, Shield, Globe, Mail, CheckCircle2, Loader2, Zap } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    title: "Premium Marketplace",
    desc: "Reach thousands of active Pokémon GO players looking to buy high-value accounts globally.",
  },
  {
    icon: Shield,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    title: "Secure Transactions",
    desc: "Every sale is verified and protected. We handle escrow, disputes, and buyer trust so you don't have to.",
  },
  {
    icon: Globe,
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    title: "Global Reach",
    desc: "List once and sell worldwide. We support USD, EUR, INR, GBP and more currencies.",
  },
  {
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    title: "Fast Payouts",
    desc: "Get paid quickly via UPI, PayPal, WISE, or crypto. Your earnings, your schedule.",
  },
];

export default function SellWithUsPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    const res = await joinWaitlist(email.trim());
    if (res.success) {
      setStatus("success");
      setEmail("");
    } else {
      setStatus("error");
      setErrorMsg(res.error || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-500/5 dark:bg-emerald-500/8 blur-3xl" />
        <div className="absolute -bottom-60 -left-40 w-[500px] h-[500px] rounded-full bg-teal-500/5 dark:bg-teal-500/8 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-violet-500/3 dark:bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-24">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>

        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Seller Program
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.05] mb-6">
            Sell Your Accounts
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
              With Confidence
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed font-medium">
            We're building a world-class seller experience for Pokémon GO account owners. 
            Join the waitlist to be first in line when we launch.
          </p>

          {/* Coming Soon pill */}
          <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 text-sm font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Coming Soon — Join the Waitlist Below
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16"
        >
          {features.map(({ icon: Icon, color, bg, border, title, desc }) => (
            <div
              key={title}
              className={`group relative p-6 rounded-2xl border ${border} ${bg} backdrop-blur-sm transition-all hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-black/20`}
            >
              <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${color} mb-4 shadow-sm`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-1.5">{title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Waitlist form */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="max-w-md mx-auto"
        >
          <div className="relative p-8 rounded-3xl border border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl dark:shadow-black/30">
            {/* Glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

            {status === "success" ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">You're on the list! 🎉</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  We'll email you the moment the seller program opens. Stay tuned!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div className="text-center mb-2">
                  <Mail className="h-7 w-7 text-emerald-500 mx-auto mb-3" />
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white">Join the Waitlist</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Be the first seller on the platform. No spam, ever.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full h-10 px-4 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/60 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  />
                  {status === "error" && (
                    <p className="text-xs text-red-500 font-medium pl-1">{errorMsg}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold transition-all shadow-sm hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Notify Me When Live
                    </>
                  )}
                </button>

                <p className="text-[10px] text-zinc-400 text-center">
                  By signing up you agree to our{" "}
                  <Link href="/privacy" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">Privacy Policy</Link>.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

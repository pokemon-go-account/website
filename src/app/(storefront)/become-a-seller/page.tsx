"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Store, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { joinWaitlist } from "@/features/waitlist/actions";

export default function BecomeASellerPage() {
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
    <div className="min-h-screen bg-white dark:bg-[#09090b] relative overflow-hidden flex items-center justify-center">
      {/* Background decorative premium gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/5 dark:bg-violet-600/10 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute -bottom-60 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl animate-pulse" style={{ animationDuration: "12s" }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 text-center flex flex-col items-center">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-16 self-start"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full relative p-8 sm:p-12 rounded-3xl border border-zinc-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-zinc-950/40 backdrop-blur-xl shadow-2xl dark:shadow-black/40 overflow-hidden"
        >
          {/* Inner ambient glow */}
          <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-[#6133e1]/10 dark:bg-[#6133e1]/15 blur-2xl pointer-events-none" />

          {/* Premium Icon Badge */}
          <div className="mx-auto mb-8 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6133e1] to-violet-500 text-white shadow-xl shadow-violet-500/20 dark:shadow-violet-600/10 animate-bounce" style={{ animationDuration: "3s" }}>
            <Store className="h-8 w-8 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6133e1]/10 border border-[#6133e1]/20 text-[#6133e1] dark:text-violet-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Coming Soon
          </div>

          {/* User's Exact Heading/Text requested */}
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.15] mb-6">
            Seller Marketplace
          </h1>

          <p className="text-sm sm:text-base text-zinc-550 dark:text-zinc-400 max-w-md mx-auto leading-relaxed font-medium mb-10">
            Seller Marketplace Coming Soon! List your accounts and sell directly to buyers through our secure platform.
          </p>

          {/* CTA Link / Button */}
          {status === "success" ? (
            <div className="text-center py-6 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">You're on the list! 🎉</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                We'll notify you the moment the seller program opens.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto w-full">
              <div className="relative w-full">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/60 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#6133e1]/50 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 h-12 rounded-xl bg-gradient-to-r from-[#6133e1] to-violet-600 hover:from-[#6c3be8] hover:to-violet-500 text-white font-bold text-sm tracking-tight transition-all shadow-lg shadow-violet-600/25 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join Waitlist"
                )}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="text-xs text-red-500 font-medium mt-3 text-center">{errorMsg}</p>
          )}
        </motion.div>

        {/* Small subtle brand signature */}
        <p className="mt-8 text-[10px] font-semibold text-zinc-400 dark:text-zinc-600 tracking-wider uppercase">
          Secure Trading Environment
        </p>
      </div>
    </div>
  );
}

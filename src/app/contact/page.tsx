"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { submitContactMessage } from "@/features/contact/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Mail, MessageSquare, Send, CheckCircle2, AlertCircle,
  Clock, ShieldCheck, Zap,
} from "lucide-react";
import Link from "next/link";

const SUBJECTS = [
  "General Inquiry",
  "Account Recovery Service",
  "Auction Support",
  "Payment Issue",
  "Bug Report",
  "Partnership / Collaboration",
  "Other",
];

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </svg>
);

const RedditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.52-4.48-10-10-10zm4.5 9c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-9 0c.83 0 1.5-.67 1.5-1.5S8.33 7.5 7.5 7.5 6 8.17 6 9s.67 1.5 1.5 1.5zm4.5 4.5c-1.84 0-3.4-.98-4.22-2.42-.1-.17-.07-.38.07-.5.15-.12.37-.1.5.07.72 1.25 2.02 2.05 3.65 2.05s2.93-.8 3.65-2.05c.13-.17.35-.2.5-.07.14.12.17.33.07.5-.82 1.44-2.38 2.42-4.22 2.42z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const INFO_CARDS = [
  {
    icon: Clock,
    title: "Response Time",
    value: "24/7 Support",
    sub: "Always online, instant response",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Secure Channel",
    value: "End-to-end encrypted",
    sub: "Your data is always protected",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Zap,
    title: "Priority Support",
    value: "Recovery clients first",
    sub: "Faster resolution for active orders",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
];

const SOCIALS = [
  {
    name: "Telegram",
    handle: "@pokemongoservicesadmin",
    href: "https://t.me/pokemongoservicesadmin",
    icon: TelegramIcon,
    color: "text-[#24A1DE]",
    bg: "bg-[#24A1DE]/10 border-[#24A1DE]/20 hover:bg-[#24A1DE]/15",
  },
  {
    name: "Reddit",
    handle: "/u/PokemonGo-Services",
    href: "https://www.reddit.com/user/PokemonGo-Services/",
    icon: RedditIcon,
    color: "text-[#FF4500]",
    bg: "bg-[#FF4500]/10 border-[#FF4500]/20 hover:bg-[#FF4500]/15",
  },
  {
    name: "Instagram",
    handle: "@pokemongoservicesadmin",
    href: "https://www.instagram.com/pokemongoservicesadmin/",
    icon: InstagramIcon,
    color: "text-[#E1306C]",
    bg: "bg-[#E1306C]/10 border-[#E1306C]/20 hover:bg-[#E1306C]/15",
  },
];

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(submitContactMessage, {
    success: false,
    error: null,
  } as any);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Decorative auras */}
      <div className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 dark:bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-14">
        
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">
            <MessageSquare className="h-3 w-3" />
            Get in Touch
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Have a question about an order, account recovery, or anything else? Send us a message and our team will be in touch within 24 hours.
          </p>
        </motion.div>

        {/* Info cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {INFO_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`flex items-start gap-3 p-4 rounded-2xl border ${card.bg} transition-colors`}
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{card.title}</p>
                  <p className={`text-sm font-bold mt-0.5 ${card.color}`}>{card.value}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{card.sub}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main grid: form + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-7 rounded-3xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl p-8 shadow-xl dark:shadow-2xl dark:shadow-black/40 space-y-6"
          >
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">Send a Message</h2>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">All fields marked with * are required.</p>
            </div>

            {state.success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 text-center space-y-4"
              >
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Message Sent!</h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    Thanks for reaching out. Our support team will get back to you within 24 hours.
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline underline-offset-4 mt-2"
                >
                  ← Back to Home
                </Link>
              </motion.div>
            ) : (
              <form action={formAction} className="space-y-5">
                {state.error && (
                  <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {state.error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="John Doe"
                      className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/[0.08] h-10 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/[0.08] h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Subject *</Label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    defaultValue=""
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-950/50 text-xs font-medium text-zinc-900 dark:text-white focus:outline-hidden transition-colors cursor-pointer"
                  >
                    <option value="" disabled className="text-zinc-400">Select a subject…</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} className="dark:bg-zinc-950 dark:text-white">{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Describe your issue or question in detail…"
                    className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/[0.08] rounded-xl text-xs resize-none leading-relaxed"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 font-extrabold text-xs tracking-wider uppercase rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-5 space-y-5"
          >
            {/* Direct contact channels */}
            <div className="rounded-3xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl p-6 shadow-lg dark:shadow-xl dark:shadow-black/30 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Direct Channels</h3>
              <div className="space-y-3">
                {SOCIALS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all group cursor-pointer ${social.bg}`}
                    >
                      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${social.bg} ${social.color}`}>
                        <Icon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{social.name}</p>
                        <p className={`text-[11px] font-semibold ${social.color} truncate`}>{social.handle}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* FAQ shortcut */}
            <div className="rounded-3xl border border-zinc-200/80 dark:border-white/[0.06] bg-gradient-to-br from-violet-500/5 to-cyan-500/5 dark:from-violet-500/[0.04] dark:to-cyan-500/[0.04] p-6 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Quick Answers</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Many common questions are already answered in our FAQ section. Check there first — you might find an instant answer!
              </p>
              <Link
                href="/#faq"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                Browse FAQ →
              </Link>
            </div>

            {/* Recovery shortcut */}
            <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-500/[0.04] p-6 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-cyan-500 dark:text-cyan-400">Account Recovery?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                If you need help recovering a lost Pokémon GO account, visit our dedicated recovery service page to submit a request directly.
              </p>
              <Link
                href="/recovery"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
              >
                Go to Recovery Service →
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

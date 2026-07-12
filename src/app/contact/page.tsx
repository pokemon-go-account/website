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
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-white transition-colors duration-300">
      <div className="relative max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-left space-y-2 pb-5 border-b border-zinc-200 dark:border-white/[0.06]"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Contact Us
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Have a question about an order, account recovery, or anything else? Send us a message and our team will get back to you.
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
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111]"
              >
                <div className="h-8 w-8 rounded-md bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{card.title}</p>
                  <p className="text-xs font-semibold mt-0.5 text-zinc-800 dark:text-zinc-200">{card.value}</p>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">{card.sub}</p>
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
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-7 rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 shadow-xs space-y-5"
          >
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">Send a Message</h2>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500">All fields marked with * are required.</p>
            </div>

            {state.success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-4"
              >
                <div className="h-10 w-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">Message Sent!</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Thanks for reaching out. Our support team will get back to you within 24 hours.
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-semibold hover:underline underline-offset-4 mt-2"
                >
                  ← Back to Home
                </Link>
              </motion.div>
            ) : (
              <form action={formAction} className="space-y-4">
                {state.error && (
                  <div className="flex items-center gap-2 rounded-md bg-red-500/5 border border-red-500/10 p-3 text-xs text-red-550 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {state.error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="John Doe"
                      className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/[0.08] h-8 px-3 rounded-md text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/[0.08] h-8 px-3 rounded-md text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Subject *</Label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    defaultValue=""
                    className="w-full h-8 px-3 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-950/50 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden transition-colors cursor-pointer"
                  >
                    <option value="" disabled className="text-zinc-400">Select a subject…</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} className="dark:bg-zinc-950 dark:text-white">{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Describe your issue or question in detail…"
                    className="bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/[0.08] rounded-md text-xs resize-none leading-relaxed"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-8 font-semibold text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-250 dark:text-zinc-900 border-0 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
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
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-5 space-y-4"
          >
            {/* Direct contact channels */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 shadow-xs space-y-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Direct Channels</h3>
              <div className="space-y-2.5">
                {SOCIALS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-md border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#151515] transition-colors group cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                        <Icon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{social.name}</p>
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-450 truncate">{social.handle}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* FAQ shortcut */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Quick Answers</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Many common questions are already answered in our FAQ section. Check there first — you might find an instant answer!
              </p>
              <Link
                href="/#faq"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-white hover:opacity-80 transition-opacity"
              >
                Browse FAQ →
              </Link>
            </div>

            {/* Recovery shortcut */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Account Recovery?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                If you need help recovering a lost Pokémon GO account, visit our dedicated recovery service page to submit a request directly.
              </p>
              <Link
                href="/recovery"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-white hover:opacity-80 transition-opacity"
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

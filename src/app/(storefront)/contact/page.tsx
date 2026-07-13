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

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.277h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.93 19.93 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
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

            <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-white/[0.06]">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">Join Our Communities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://www.facebook.com/groups/663972790424791/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-md border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#151515] transition-colors group cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-400 group-hover:text-[#1877F2] transition-colors">
                    <FacebookIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Pokemon Go Community</p>
                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-450 truncate">88.2K members</p>
                  </div>
                </a>
                <a
                  href="https://www.facebook.com/groups/178371228350769"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-md border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#151515] transition-colors group cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-400 group-hover:text-[#1877F2] transition-colors">
                    <FacebookIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Pokemon Go Trade and Shiny</p>
                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-450 truncate">24.5K members</p>
                  </div>
                </a>
                <a
                  href="https://t.me/pokemon_go"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-md border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#151515] transition-colors group cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-400 group-hover:text-[#24A1DE] transition-colors">
                    <TelegramIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Telegram Group</p>
                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-450 truncate">@pokemon_go</p>
                  </div>
                </a>
                <a
                  href="https://t.me/PokemonGoAccountss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-md border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#151515] transition-colors group cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-400 group-hover:text-[#24A1DE] transition-colors">
                    <TelegramIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Telegram Group</p>
                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-450 truncate">@PokemonGoAccountss</p>
                  </div>
                </a>
                <a
                  href="https://discord.com/invite/Zt2yE3qKY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-md border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#151515] transition-colors group cursor-pointer sm:col-span-2"
                >
                  <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-400 group-hover:text-[#5865F2] transition-colors">
                    <DiscordIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Official Discord Server</p>
                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-450 truncate">Join Community</p>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-5 space-y-4"
          >
            {/* Email Channels */}
            <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 shadow-xs space-y-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Email Addresses</h3>
              <div className="space-y-2.5">
                {[
                  {
                    name: "Support Desk",
                    email: "support@pokemongoservices.com",
                    desc: "Auction issues, payments & active orders",
                  },
                  {
                    name: "Business Operations",
                    email: "business@pokemongoservices.com",
                    desc: "Partnerships, careers & marketing",
                  },
                  {
                    name: "General Info",
                    email: "info@pokemongoservices.com",
                    desc: "General questions & service details",
                  },
                ].map((item) => (
                  <a
                    key={item.email}
                    href={`mailto:${item.email}`}
                    className="flex items-center gap-3 p-3 rounded-md border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#151515] transition-all hover:border-[#6133e1]/30 hover:bg-zinc-100 dark:hover:bg-[#181818] group cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-550 group-hover:text-[#6133e1] dark:group-hover:text-purple-400 transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{item.name}</p>
                      <p className="text-[10px] font-semibold text-[#6133e1] dark:text-[#a78bfa]">{item.email}</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-450 truncate mt-0.5">{item.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

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

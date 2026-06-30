"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export function Hero() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden bg-background py-24 md:py-32 px-4 text-center">
      {/* Subtle ambient radial background glow */}
      <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_50%)]" />

      <motion.div
        initial="initial"
        animate="animate"
        transition={{ staggerChildren: 0.15 }}
        className="max-w-4xl space-y-6"
      >
        {/* Animated Badge */}
        <motion.div variants={fadeIn} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-md">
          <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span>The Next Generation of Gaming Marketplaces</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 variants={fadeIn} transition={{ duration: 0.6, ease: "easeOut" }} className="text-4xl font-semibold tracking-tighter sm:text-6xl md:text-7xl bg-gradient-to-b from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
          Secure Live Auctions <br />for Premium Gaming Assets
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={fadeIn} transition={{ duration: 0.6 }} className="mx-auto max-w-xl text-md sm:text-lg text-muted-foreground tracking-normal font-light">
          Experience hyper-fast, scheduled live bidding for elite gaming accounts. Fully verified, platform-intermediated, and completely secure.
        </motion.p>

        {/* Call to Actions */}
        <motion.div variants={fadeIn} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/register" className="group inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95 text-sm">
            Explore Live Auctions
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-muted/30 px-6 font-medium text-foreground transition-all hover:bg-muted active:scale-95 text-sm backdrop-blur-sm">
            List Your Account
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
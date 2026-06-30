"use client";

import { motion } from "framer-motion";
import { Shield, Timer, Users, Key } from "lucide-react";

const features = [
  {
    icon: Timer,
    title: "Scheduled Live Auctions",
    description: "Every second matters. Experience real-time high-concurrency bidding driven by ultra-low latency event architecture.",
  },
  {
    icon: Shield,
    title: "Intermediated Security",
    description: "The platform handles all assets securely. Sellers transfer to us, we verify execution, and buyers confirm delivery flawlessly.",
  },
  {
    icon: Key,
    title: "Protected Identity",
    description: "Telegram handles and structural account properties remain fully hidden from the public view until absolute finality.",
  },
  {
    icon: Users,
    title: "Verified Bidder Pools",
    description: "Our strict nominal registration configuration ensures only serious, high-intent bidders enter live action blocks.",
  },
];

export function Features() {
  return (
    <section className="border-t border-border bg-neutral-50/50 dark:bg-neutral-950/40 py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="space-y-2 text-center md:max-w-xl md:text-left">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Engineered for elite trading.
          </h2>
          <p className="text-sm text-muted-foreground">
            We stripped away the noisy gaming aesthetics to focus entirely on precision metrics, clean security, and raw execution velocity.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ y: -4, borderColor: "var(--primary)" }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-border bg-card/50 dark:bg-neutral-900/20 p-6 backdrop-blur-sm transition-colors"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-muted">
                <feature.icon className="h-5 w-5 text-primary dark:text-neutral-400" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
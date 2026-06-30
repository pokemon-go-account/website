"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How does the escrow transfer workflow operate?",
    a: "Once an auction reaches completion, our team directly secures the gaming credentials from the seller. We perform comprehensive anti-recovery validation checklines before transferring the profile over to the victorious bidder.",
  },
  {
    q: "What happens if a winning bidder refuses to clear payments?",
    a: "The bidder forfeits their nominal ₹199 entry validation registration deposit, their platform profile gets immediately blacklisted, and the option passes systematically down to the runner-up bidder tier.",
  },
  {
    q: "Are the seller's communication handles public?",
    a: "Never. To protect users from targeted fishing exploits, direct communication occurs exclusively through our verified intermediate system protocols.",
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="border-t border-border py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-center text-foreground sm:text-3xl">
          Frequently Asked Questions
        </h2>
        <div className="mt-12 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="overflow-hidden rounded-lg border border-border bg-card/50 dark:bg-neutral-900/10 backdrop-blur-sm">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="border-t border-border/60 p-5 text-xs leading-relaxed text-muted-foreground bg-muted/20 dark:bg-neutral-950/20">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "How does the escrow transfer workflow operate?", a: "Once an auction reaches completion, our team directly secures the gaming credentials from the seller. We perform comprehensive anti-recovery validation checklines before transferring the profile over to the victorious bidder." },
  { q: "What happens if a winning bidder refuses to clear payments?", a: "The bidder forfeits their nominal $2.50 entry validation registration deposit, their platform profile gets immediately blacklisted, and the option passes systematically down to the runner-up bidder tier." },
  { q: "Are the seller's communication handles public?", a: "Never. To protect users from targeted fishing exploits, direct communication occurs exclusively through our verified intermediate system protocols." },
  { q: "How are sellers verified on the platform?", a: "All sellers go through an identity verification process before listing. We verify their Pokémon GO account ownership and cross-check credentials before any auction goes live." },
  { q: "What payment methods do you accept?", a: "We accept PayPal, Visa, Mastercard, and UPI. All transactions are processed securely with buyer protection guarantees." },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-white dark:bg-[#080809] border-t border-gray-100 dark:border-white/[0.06] py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-gray-900 dark:text-white font-extrabold text-2xl tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500 dark:text-gray-600 text-sm">
            Everything you need to know about bidding and selling.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isOpen
                    ? "border-gray-400/30 dark:border-white/20 bg-gray-50 dark:bg-[#111113]"
                    : "border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0d0d0f] hover:border-gray-300 dark:hover:border-white/[0.12]"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-300 ml-4 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                      <div className="border-t border-gray-100 dark:border-white/[0.06] px-5 py-4 text-sm leading-relaxed text-gray-500 dark:text-gray-500">
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
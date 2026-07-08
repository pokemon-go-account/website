"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, MessageSquare } from "lucide-react";

const faqs = [
  // General & Trust (1-4)
  {
    q: "What is Pokémon GO Services & Auctions?",
    a: "We are a premium secondary marketplace specializing in high-tier Pokémon GO account trading, raiding boosts, stardust services, and custom items. We offer both live scheduled auctions and direct storefront purchase options."
  },
  {
    q: "Is this platform safe to use?",
    a: "Absolutely. All transactions are securely handled using our middleman escrow system. Sellers must verify account ownership and undergo strict identity checks. We also back storefront accounts with a 7-day money-back ban guarantee."
  },
  {
    q: "How do I create an account and start participating?",
    a: "Simply click 'Register' at the top right of our header, complete the quick credentials validation, and verify your email. Once registered, you can immediately browse the storefront, schedule items, or register for active live auctions."
  },
  {
    q: "Where do these accounts come from?",
    a: "Every account listed is sourced from verified original owners, veteran players, or professional service partners. We run automatic security sweeps on every account before approval to check for past ban flags or cheat history."
  },

  // Auctions system (5-11)
  {
    q: "How does the live bidding system operate?",
    a: "Each auction has a scheduled start and end time. Registered users can place bids in real-time. When a bid is placed within the final 2 minutes, the clock automatically extends by 60 seconds to prevent sniper bots."
  },
  {
    q: "Why is a $2.50 registration deposit required for auctions?",
    a: "The registration deposit serves as a nominal stake to prevent spam bidding, bot entries, and bad-faith bidders. It ensures that every bidder on our live room dashboard is a verified, serious buyer."
  },
  {
    q: "Is the $2.50 deposit refunded if I lose?",
    a: "Yes! If you do not win the auction, the $2.50 registration validation deposit is automatically refunded back to your payment method within 24 hours of the auction's conclusion."
  },
  {
    q: "What happens if a winning bidder refuses to pay?",
    a: "If the winner fails to settle payments within 12 hours of the auction closing, their registration deposit is forfeited. The platform automatically blocks their account, and the purchase offer is cascaded down to the runner-up bidder."
  },
  {
    q: "How does the runner-up bidder cascade work?",
    a: "If the highest bidder forfeits or is disqualified, the second-highest bidder (runner-up) receives an email notification with an invitation to claim the account at their highest bid value. They have 12 hours to accept."
  },
  {
    q: "Are bid increments fixed?",
    a: "No. Each listing has a custom 'Minimum Increment' set by the seller (usually $50 or $100). Bidders can choose to place a bid at the minimum increment or enter a higher custom bid value."
  },
  {
    q: "Can I edit or retract my bid once placed?",
    a: "Bids are legally binding contracts on our platform. Once a bid is broadcast to the live room, it cannot be edited, retracted, or cancelled. Please bid responsibly."
  },

  // Storefront Services (12-16)
  {
    q: "What are direct storefront services?",
    a: "Storefront services let you purchase premade accounts, stardust packs, regional catch packages, level boosts, and raid coordinates directly. Unlike auctions, storefront purchases do not require bidding or deposit fees."
  },
  {
    q: "How does the storefront shopping cart work?",
    a: "You can add multiple storefront accounts, items, or boosts to your virtual cart. The header cart drawer lists your selected items, updates quantities, and calculates the total value dynamically before checkout."
  },
  {
    q: "Why is storefront checkout completed via Telegram?",
    a: "Pokémon GO coordinates and login handovers require real-time collaboration. Checkout redirects you to our secure Telegram support bot, where our trade managers immediately process your order, request coordinate parameters, and guide your account transfer."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major international payment systems, including credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, UPI (for INR), and selected secure cryptocurrencies."
  },
  {
    q: "Can I cancel a storefront order before delivery?",
    a: "Storefront orders can be cancelled for a full refund up until our trade managers begin processing the transfer on your device. Once processing begins, orders are locked and cannot be cancelled."
  },

  // Escrow & Handover (17-21)
  {
    q: "How does the intermediate escrow system work?",
    a: "When you buy an account, your payment is held securely in escrow. Our team takes possession of the account details, resets recovery coordinates, changes email links, and verifies contents. We only release funds to the seller after you confirm full access."
  },
  {
    q: "What are 'changeable email coordinates'?",
    a: "All accounts sold on our platform are delivered with 'changeable email coordinates'. This means you can immediately bind your own personal email address and update the account recovery phone numbers, locking out the previous owner."
  },
  {
    q: "How long does account delivery take?",
    a: "Storefront account handovers are usually completed within 1 to 2 hours. Auction deliveries are initiated immediately after the winner clears payment and are typically completed within 3 hours."
  },
  {
    q: "Do you offer a ban strike guarantee?",
    a: "Yes. All accounts come with a 7-day Ban Guarantee. If the account receives a Niantic warning or ban strike due to seller-side activities within 7 days of delivery, we will issue a full refund or a replacement account."
  },
  {
    q: "Can I sell my own Pokémon GO account?",
    a: "Yes! Registered users can navigate to the admin console and submit a listing application. Our moderation team reviews listing parameters, verifies account statistics, and schedules the auction block."
  },

  // Technical & Support (22-25)
  {
    q: "What is Niantic's policy on account trading?",
    a: "Niantic's Terms of Service discourage account selling. To protect our buyers, we implement strict anonymity measures. We blur trainer names, friend codes, and coordinate locations on public listings."
  },
  {
    q: "How are regional coordinates handled for catches?",
    a: "For regional catching services, our partners use safe, speed-capped coordinate travel times to prevent triggers. We require a 2-hour cooldown period where you must log out of your account before and after the service."
  },
  {
    q: "What happens if a boost service is not fully completed?",
    a: "If a boost service (e.g., catching 100 shinies) is only partially completed, you will receive a pro-rata refund for the uncompleted portion of the order, along with a support credit coupon."
  },
  {
    q: "How can I contact support if I have issues?",
    a: "Our customer success team is available 24/7. You can open a ticket via the 'Contact Us' page, reach out directly in our Telegram channel, or start a live support session inside the active live room dashboard."
  }
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayedFaqs = showAll ? faqs : faqs.slice(0, 5);

  return (
    <section id="faq" className="bg-white dark:bg-[#080809] border-t border-zinc-100 dark:border-white/[0.06] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600 dark:text-violet-400 border border-violet-500/20 mb-3">
            <HelpCircle className="h-3.5 w-3.5" />
            Support Center
          </span>
          <h2 className="text-zinc-900 dark:text-white font-extrabold text-2xl sm:text-3xl tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Have questions about auctions, storefront orders, checkout systems, or escrow coordinates? We have answers.
          </p>
        </div>

        <div className="space-y-3">
          {displayedFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "border-violet-500/30 dark:border-violet-500/20 bg-zinc-50 dark:bg-[#111113]"
                    : "border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-[#0d0d0f] hover:border-zinc-300 dark:hover:border-white/[0.12]"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between px-5 py-4.5 text-left text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-300 ml-4 ${isOpen ? "rotate-180 text-violet-500" : ""}`}
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
                      <div className="border-t border-zinc-100 dark:border-white/[0.06] px-5 py-4 text-xs sm:text-sm leading-relaxed text-zinc-500 dark:text-zinc-450 font-light">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setShowAll(!showAll);
              setOpenIdx(null);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-150 text-white dark:text-black font-extrabold text-xs px-6 py-2.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            {showAll ? "Show Less Questions" : "View All Questions (25)"}
          </button>
        </div>
      </div>
    </section>
  );
}
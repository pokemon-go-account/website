"use client";

import { Search, Gavel, Trophy, Package } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const steps = [
  { icon: Search, step: "Browse", description: "Find the perfect account or item from our curated auction listings." },
  { icon: Gavel, step: "Bid", description: "Place your bid and compete with trainers from around the world." },
  { icon: Trophy, step: "Win", description: "Win the auction and secure your prized Pokémon GO asset." },
  { icon: Package, step: "Receive", description: "Receive your purchase safely with our secure middleman delivery." },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 dark:bg-[#0d0d0f] border-t border-gray-100 dark:border-white/[0.06] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-gray-900 dark:text-white font-extrabold text-2xl tracking-tight mb-2">
            How It Works
          </h2>
          <p className="text-gray-500 dark:text-gray-600 text-sm">Get started in four simple steps.</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {steps.map(({ icon: Icon, step, description }, index) => (
            <motion.div
              key={step}
              variants={cardVariants}
              className="relative group rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#111113] p-6 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 dark:group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.04),transparent_70%)]" />

              <div className="relative">
                {/* Number + Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative h-11 w-11 rounded-xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-gray-950 dark:text-white" />
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-black flex items-center justify-center shadow-sm">
                      {index + 1}
                    </span>
                  </div>
                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-white/10 to-transparent" />
                  )}
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold text-sm mb-1.5">{step}</h3>
                <p className="text-gray-500 dark:text-gray-600 text-xs leading-relaxed">{description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

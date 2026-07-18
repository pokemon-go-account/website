"use client";

import { ShieldCheck, Users, Lock, Headphones } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const stats = [
  { value: "28,000+", label: "Services Sold" },
  { value: "15,000+", label: "Happy Customers" },
  { value: "100%", label: "Successful Deliveries" },
];

const features = [
  { icon: ShieldCheck, title: "100% Secure", description: "Your safety is our priority. Secure transactions always." },
  { icon: Users, title: "Trusted Community", description: "Join thousands of happy trainers worldwide." },
  { icon: Lock, title: "Safe Payments", description: "Secure payment methods for peace of mind." },
  { icon: Headphones, title: "24/7 Support", description: "We're here to help you anytime, anywhere." },
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

export function Features() {
  return (
    <section className="relative w-full overflow-hidden border-b border-zinc-200 dark:border-white/[0.06]">
      <div className="absolute inset-0 bg-white dark:bg-[#09090B] z-[-2] pointer-events-none" />

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {stats.map(({ value, label }) => (
            <motion.div
              key={label}
              variants={cardVariants}
              className="relative rounded-md border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#111111] overflow-hidden px-6 py-6 text-center group hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300"
            >
              <p className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none mb-2">
                {value}
              </p>
              <p className="text-zinc-700 dark:text-zinc-350 text-xs font-semibold tracking-wide">
                {label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
"use client";

import { ShieldCheck, Users, Lock, Headphones } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const stats = [
  { value: "8,000+", label: "Accounts Sold" },
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
    <section className="bg-white dark:bg-[#080809] border-b border-gray-100 dark:border-white/[0.06]">

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
              className="relative rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-[#111113] overflow-hidden px-6 py-7 text-center group hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300"
            >
              {/* Subtle white glow in dark */}
              <div className="absolute inset-0 opacity-0 dark:group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04),transparent_70%)]" />
              <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                {value}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm font-medium tracking-wide">
                {label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
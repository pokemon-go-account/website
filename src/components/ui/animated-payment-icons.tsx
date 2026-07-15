"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  FaBitcoin, 
  FaEthereum, 
  FaPaypal, 
  FaCcVisa, 
  FaCcMastercard, 
  FaCcAmex,
  FaApplePay
} from "react-icons/fa";
import { SiTether, SiCashapp } from "react-icons/si";

// Wise SVG path since it might not be perfectly represented in react-icons
export const WiseIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M10.155 12.01l-1.925 5.253-2.07-.008L9.444 8.28H5.06l-.423 1.346-2.288-.009 1.155-3.568h14.773l-1.076 2.92-3.327-.015-1.996 5.61-2.12-.008 1.4-3.545-1.003-.002z" />
  </svg>
);

export const PaypalIcon = ({ className }: { className?: string }) => (
  <FaPaypal className={className} />
);

const cryptoIcons = [
  { icon: FaBitcoin, color: "#F7931A" },
  { icon: FaEthereum, color: "#627EEA" },
  { icon: SiTether, color: "#26A17B" },
];

export const AnimatedCryptoIcon = ({ className }: { className?: string }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % cryptoIcons.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className || "w-5 h-5"}`}>
      <AnimatePresence mode="wait">
        {cryptoIcons.map((item, i) => (
          i === index && (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <item.icon className="w-full h-full" style={{ color: item.color }} />
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  );
};

const cardIcons = [
  { icon: FaCcVisa, color: "#1434CB" },
  { icon: FaCcMastercard, color: "#EB001B" },
  { icon: FaCcAmex, color: "#2E77BC" },
  { icon: SiCashapp, color: "#00D632" },
  { icon: FaApplePay, color: "currentColor" },
];

export const AnimatedCardIcon = ({ className }: { className?: string }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % cardIcons.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className || "w-5 h-5"}`}>
      <AnimatePresence mode="wait">
        {cardIcons.map((item, i) => (
          i === index && (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <item.icon className="w-full h-full" style={{ color: item.color }} />
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  );
};

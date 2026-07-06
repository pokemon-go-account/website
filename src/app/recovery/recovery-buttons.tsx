"use client";

import { useCartStore } from "@/store/useCartStore";
import { handleTelegramCheckout } from "@/utils/checkout";
import { ShoppingCart, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface RecoveryButtonsProps {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
}

export function RecoveryButtons({ product }: RecoveryButtonsProps) {
  const { addItem, setIsOpen } = useCartStore();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    setIsOpen(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleInstantTelegram = () => {
    const singleItem = [
      {
        id: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: 1,
      },
    ];
    handleTelegramCheckout(singleItem, product.price);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        className="flex-1 h-12 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-900 dark:text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 border border-zinc-200 dark:border-white/[0.06] transition-all duration-200 active:scale-98 cursor-pointer shadow-xs"
      >
        <ShoppingCart className="h-4 w-4" />
        <span>{added ? "Added to Cart!" : "Add to Cart"}</span>
      </button>

      {/* Telegram Order */}
      <button
        onClick={handleInstantTelegram}
        className="flex-1 h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 cursor-pointer shadow-md"
      >
        <Send className="h-4 w-4 fill-current" />
        <span>Instant Telegram Checkout</span>
      </button>
    </div>
  );
}

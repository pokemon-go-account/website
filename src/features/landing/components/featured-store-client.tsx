"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { PriceDisplay } from "@/components/price-display";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface StoreProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  mrpPrice?: number;
  discountedPrice?: number;
  badge?: "MOST_PURCHASED" | "POPULAR" | "";
  isLimitedDeal?: boolean;
  dealExpiry?: string | Date;
  imageUrl?: string;
  categoryId?: {
    _id: string;
    name: string;
    slug: string;
  };
}

interface FeaturedStoreClientProps {
  products: StoreProduct[];
}

function CountdownTimer({ expiry }: { expiry: string | Date }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(expiry) - +new Date();
      if (difference <= 0) {
        setTimeLeft("EXPIRED");
        setIsExpired(true);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      let timeStr = "";
      if (days > 0) timeStr += `${days}d `;
      timeStr += `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      setTimeLeft(timeStr);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [expiry]);

  if (isExpired) return null;

  return (
    <div className="absolute bottom-2 left-2 z-10 bg-red-600/90 dark:bg-red-500/95 text-white font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1 shadow-sm animate-pulse">
      <span className="h-1.5 w-1.5 rounded-full bg-white block"></span>
      <span>ENDS IN: {timeLeft}</span>
    </div>
  );
}

export function FeaturedStoreClient({ products }: FeaturedStoreClientProps) {
  if (products.length === 0) return null;

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white text-[10px] font-semibold px-2.5 py-1 rounded-md">
          <ShoppingBag className="h-3.5 w-3.5" />
          Direct Storefront
        </span>
        <h2 className="text-zinc-900 dark:text-white font-semibold text-xl tracking-tight">
          Featured Store Services
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs max-w-lg mx-auto">
          Get instant access to premium Pokémon GO accounts, stardust boost, and other essential trainer assets.
        </p>
      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="group relative flex flex-col justify-between rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 hover:shadow-xs"
          >
            <div className="space-y-4">
              {/* Product Image & Category Badge & Popular/Most Purchased Badge */}
              <div className="relative aspect-video w-full rounded-md overflow-hidden border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/10 flex items-center justify-center">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain group-hover:scale-102 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-4xl select-none">🎁</span>
                )}
                {product.categoryId?.name && (
                  <span className="absolute bottom-3 right-3 bg-zinc-900/80 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-md tracking-wider uppercase border border-white/10">
                    {product.categoryId.name}
                  </span>
                )}
                
                {/* Badges Container */}
                <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
                  {product.isLimitedDeal && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white shadow-md bg-red-600 animate-pulse">
                      Limited Time Deal
                    </span>
                  )}
                  {product.badge && (
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white shadow-md",
                      product.badge === "MOST_PURCHASED" ? "bg-amber-500" : "bg-purple-600"
                    )}>
                      {product.badge === "MOST_PURCHASED" ? "Most Purchased" : "Popular"}
                    </span>
                  )}
                </div>
                {/* Limited Time Deal Countdown */}
                {product.isLimitedDeal && product.dealExpiry && (
                  <CountdownTimer expiry={product.dealExpiry} />
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white tracking-tight line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed min-h-[32px]">
                  {product.description || "Premium service with secure coordination."}
                </p>
              </div>
            </div>

            {/* Price & Call To Action */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-200 dark:border-white/[0.06]">
              <div>
                {typeof product.mrpPrice === 'number' && typeof product.discountedPrice === 'number' && product.mrpPrice > product.discountedPrice ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-550 line-through">
                        <PriceDisplay amountInUSD={product.mrpPrice} />
                      </span>
                      <span className="text-[9px] font-bold text-red-500 dark:text-red-400 bg-red-500/10 px-1 rounded">
                        {Math.round(((product.mrpPrice - product.discountedPrice) / product.mrpPrice) * 100)}% OFF
                      </span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      <PriceDisplay amountInUSD={product.discountedPrice} />
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block leading-none">Price</span>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">
                      <PriceDisplay amountInUSD={product.price} />
                    </p>
                  </div>
                )}
              </div>
              <Link
                href={product.categoryId?.slug ? `/store/${product.categoryId.slug}?productId=${product._id}` : `/store?productId=${product._id}`}
                className="h-8 px-3 inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-md text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                Buy Now
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Explore Store Button */}
      <div className="text-center pt-4">
        <Link
          href="/store"
          className="inline-flex h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold items-center justify-center transition-all active:scale-[0.98]"
        >
          Explore Storefront
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { PriceDisplay } from "@/components/price-display";

interface StoreProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
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
              {/* Product Image & Category Badge */}
              <div className="relative aspect-video w-full rounded-md overflow-hidden border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/10 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-102 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-4xl select-none">🎁</span>
                )}
                {product.categoryId?.name && (
                  <span className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-md tracking-wider uppercase border border-white/10">
                    {product.categoryId.name}
                  </span>
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
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Price</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                  <PriceDisplay amountInUSD={product.price} />
                </span>
              </div>
              <Link
                href="/store"
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

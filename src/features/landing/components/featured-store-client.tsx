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
        <span className="inline-flex items-center gap-1.5 bg-[#6133e1]/10 text-[#6133e1] text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border border-[#6133e1]/20">
          <ShoppingBag className="h-3 w-3" />
          Direct Storefront
        </span>
        <h2 className="text-gray-900 dark:text-white font-extrabold text-2xl tracking-tight">
          Featured Store Services
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-lg mx-auto">
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
            className="group relative flex flex-col justify-between rounded-2xl border border-gray-250 dark:border-white/[0.06] bg-white dark:bg-[#111113] p-5 hover:border-[#6133e1]/40 dark:hover:border-[#6133e1]/40 transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/5"
          >
            {/* Subtle background glow */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top_left,rgba(97,51,225,0.02),transparent_70%)] pointer-events-none" />

            <div className="space-y-4">
              {/* Product Image & Category Badge */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-white/[0.04] bg-zinc-50 dark:bg-black/30 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-4xl select-none">🎁</span>
                )}
                {product.categoryId?.name && (
                  <span className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-xs text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md tracking-wider uppercase border border-white/10">
                    {product.categoryId.name}
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className="font-bold text-base text-gray-900 dark:text-white tracking-tight line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed min-h-[32px]">
                  {product.description || "Premium service with secure coordination."}
                </p>
              </div>
            </div>

            {/* Price & Call To Action */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-white/[0.04]">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Price</span>
                <span className="text-base font-black text-gray-900 dark:text-white">
                  <PriceDisplay amountInUSD={product.price} />
                </span>
              </div>
              <Link
                href="/store"
                className="h-8 px-4 inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-[#6133e1] text-white dark:bg-white dark:hover:bg-[#6133e1] dark:hover:text-white dark:text-black rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-sm"
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
          className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-[#6133e1] hover:bg-[#5229c1] text-white text-xs font-extrabold tracking-wider uppercase transition-all shadow-md hover:shadow-[#6133e1]/20 active:scale-95 cursor-pointer"
        >
          Explore Storefront
          <ArrowRight className="h-4.5 w-4.5" />
        </Link>
      </div>
    </div>
  );
}

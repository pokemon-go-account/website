"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, Minus, Trash2, X, AlertCircle, ArrowRight, ChevronLeft } from "lucide-react";
import { useCartStore, CartItem } from "@/store/useCartStore";
import { handleTelegramCheckout } from "@/utils/checkout";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  categoryId?: {
    _id: string;
    name: string;
    slug: string;
  };
}

interface StorefrontClientProps {
  categories: Category[];
  products: Product[];
}

export function StorefrontClient({ categories, products }: StorefrontClientProps) {
  const { items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Group products by category ID
  const productsByCategory = categories.reduce((acc, cat) => {
    acc[cat._id] = products.filter((p) => p.categoryId?._id === cat._id);
    return acc;
  }, {} as Record<string, Product[]>);

  const selectedCategoryObj = categories.find((cat) => cat._id === selectedCategoryId);
  const catProducts = selectedCategoryId ? (productsByCategory[selectedCategoryId] || []) : [];

  const categoryGradients: Record<string, string> = {
    stardust: "from-amber-500/10 via-yellow-500/5 to-transparent border-amber-500/20 dark:border-amber-500/15 hover:border-amber-500/40",
    accounts: "from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/20 dark:border-blue-500/15 hover:border-blue-500/40",
    coins: "from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20 dark:border-emerald-500/15 hover:border-emerald-500/40",
    items: "from-violet-500/10 via-purple-500/5 to-transparent border-violet-500/20 dark:border-violet-500/15 hover:border-violet-500/40",
    "level-up": "from-rose-500/10 via-red-500/5 to-transparent border-rose-500/20 dark:border-rose-500/15 hover:border-rose-500/40",
    default: "from-zinc-500/10 via-neutral-500/5 to-transparent border-zinc-250 dark:border-white/[0.08] hover:border-zinc-400 dark:hover:border-zinc-700/50"
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Top action/cart bar */}
      <div className="sticky top-[53px] z-40 w-full bg-white/80 dark:bg-black/60 backdrop-blur-md border-b border-zinc-200 dark:border-white/[0.05] py-4 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Direct Storefront
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Sleek Pokémon GO services & asset checkout</p>
          </div>

          {/* Floating Cart Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative h-10 px-4 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-zinc-800 dark:text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95 shrink-0"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>View Cart</span>
            {getTotalItems() > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black flex items-center justify-center animate-pulse">
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!selectedCategoryId ? (
          /* Screen 1: Category Selection Screen */
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Select a Category</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose one of our premium direct service categories to browse and purchase gaming assets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
              {categories.map((cat) => {
                const count = productsByCategory[cat._id]?.length || 0;
                const gradient = categoryGradients[cat.slug] || categoryGradients.default;
                return (
                  <div
                    key={cat._id}
                    onClick={() => setSelectedCategoryId(cat._id)}
                    className={cn(
                      "group relative rounded-3xl border p-8 flex flex-col justify-between h-56 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-primary/5 cursor-pointer bg-gradient-to-br bg-white dark:bg-zinc-900/10",
                      gradient
                    )}
                  >
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />

                    <div className="space-y-4">
                      {/* Icon */}
                      <div className="h-12 w-12 rounded-2xl bg-zinc-900/10 dark:bg-white/5 border border-zinc-900/15 dark:border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                        {cat.slug === "accounts" ? "🎮" : cat.slug === "stardust" ? "✨" : cat.slug === "coins" ? "🪙" : cat.slug === "items" ? "🎒" : "⭐"}
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{cat.name}</h3>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 tracking-wider uppercase font-bold">
                          {count} {count === 1 ? "listing" : "listings"} ready
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:translate-x-1 transition-transform duration-300 inline-flex items-center gap-1.5 mt-4 self-start">
                      Explore Services <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Screen 2: Products of Selected Category Screen */
          <div className="space-y-8">
            {/* Header / Nav Options */}
            <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/[0.05] pb-6">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="h-9 w-9 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-white/5 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95 shadow-xs"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tracking-widest uppercase font-black block">Direct Storefront</span>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                  {selectedCategoryObj?.name}
                </h2>
              </div>
            </div>

            {/* Product list */}
            {catProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 rounded-3xl border border-dashed border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-zinc-900/10">
                <AlertCircle className="h-7 w-7 text-zinc-400" />
                <p className="text-xs text-zinc-500">No storefront services available under this category at the moment.</p>
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className="h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold transition-all active:scale-95"
                >
                  Return to Categories
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {catProducts.map((product) => (
                  <div
                    key={product._id}
                    className="group relative rounded-2xl border border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-white/[0.04] dark:bg-white/[0.01] dark:hover:border-white/[0.09] p-4 transition-all duration-300 flex flex-col justify-between hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.01)]"
                  >
                    {/* Subtle background glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.01),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02),transparent_70%)] pointer-events-none" />

                    <div className="space-y-3">
                      {/* Image Container */}
                      <div className="relative h-32 w-full rounded-xl bg-zinc-100 dark:bg-zinc-950/60 overflow-hidden flex items-center justify-center border border-zinc-200 dark:border-white/[0.03]">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <span className="text-3xl select-none">🎁</span>
                        )}
                      </div>

                      {/* Detail */}
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight leading-snug truncate">
                          {product.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-normal line-clamp-2 h-8">
                          {product.description || "Premium assets secure deployment coordinate."}
                        </p>
                      </div>
                    </div>

                    {/* Price & Add to Cart button */}
                    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-white/[0.04] flex items-center justify-between">
                      <div>
                        <p className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Price</p>
                        <p className="text-zinc-900 dark:text-white font-black text-sm mt-0.5">${product.price.toLocaleString()}</p>
                      </div>

                      <button
                        onClick={() =>
                          addItem({
                            id: product._id,
                            name: product.name,
                            price: product.price,
                            imageUrl: product.imageUrl,
                          })
                        }
                        className="h-8 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-md"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart side-drawer (Frosted glass) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#09090B]/90 backdrop-blur-xl border-l border-zinc-200 dark:border-white/[0.06] p-6 flex flex-col justify-between shadow-2xl transition-colors duration-300"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.05] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-zinc-900 dark:text-white" />
                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Your Shopping Cart</h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Cart list items */}
                {items.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <AlertCircle className="h-8 w-8 text-zinc-400 dark:text-zinc-650 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-500">Cart is empty</h4>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1 max-w-xs mx-auto leading-normal">
                        Browse our storefront listings on the left and add assets to queue your escrow checkout.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50 dark:border-white/[0.04] dark:bg-white/[0.01] hover:bg-zinc-100 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="h-12 w-12 rounded-lg bg-zinc-200 dark:bg-zinc-950/60 flex items-center justify-center border border-zinc-200 dark:border-white/[0.03] overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
                          ) : (
                            <span className="text-xl">🎁</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate leading-snug">{item.name}</h4>
                          <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">${item.price.toLocaleString()} each</p>
                        </div>

                        {/* Adjuster */}
                        <div className="flex items-center gap-2 border border-zinc-200 dark:border-white/[0.05] bg-zinc-100 dark:bg-zinc-950/40 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-5 w-5 rounded hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-black text-zinc-900 dark:text-white min-w-4 text-center select-none">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-5 w-5 rounded hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/5 flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer footer layout */}
              {items.length > 0 && (
                <div className="border-t border-zinc-200 dark:border-white/[0.05] pt-4 mt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 font-medium">Total Value:</span>
                    <span className="text-zinc-900 dark:text-white font-black text-lg">${getTotalPrice().toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => handleTelegramCheckout(items, getTotalPrice())}
                    className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                  >
                    <span>Submit Escrow Order</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">(via Telegram)</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

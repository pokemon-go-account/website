"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, Minus, Trash2, X, AlertCircle } from "lucide-react";
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
  const [activeCategory, setActiveCategory] = useState<string>("");
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Group products by category ID
  const productsByCategory = categories.reduce((acc, cat) => {
    acc[cat._id] = products.filter((p) => p.categoryId?._id === cat._id);
    return acc;
  }, {} as Record<string, Product[]>);

  // Set first category as active initially
  useEffect(() => {
    if (categories.length > 0) {
      setActiveCategory(categories[0]._id);
    }
  }, [categories]);

  // Track scroll position to update active category
  useEffect(() => {
    const handleScroll = () => {
      let currentActive = activeCategory;
      let minDistance = Infinity;

      categories.forEach((cat) => {
        const element = categoryRefs.current[cat._id];
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if top of section is near the viewport header
          const distance = Math.abs(rect.top - 100);
          if (rect.top <= 150 && distance < minDistance) {
            minDistance = distance;
            currentActive = cat._id;
          }
        }
      });

      if (currentActive && currentActive !== activeCategory) {
        setActiveCategory(currentActive);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories, activeCategory]);

  const scrollToCategory = (categoryId: string) => {
    const element = categoryRefs.current[categoryId];
    if (element) {
      const offset = 80; // offset for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveCategory(categoryId);
    }
  };

  return (
    <div className="relative min-h-screen bg-black dark:bg-[#09090B] text-white">
      {/* Top action/cart bar */}
      <div className="sticky top-[53px] z-40 w-full bg-black/60 dark:bg-[#09090B]/60 backdrop-blur-md border-b border-white/[0.05] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Direct Storefront
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Sleek Pokémon GO services & asset checkout</p>
          </div>

          {/* Floating Cart Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative h-10 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95 shrink-0"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>View Cart</span>
            {getTotalItems() > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center animate-pulse">
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Sticky categories list */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-2 max-h-[70vh] overflow-y-auto pr-2">
              <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-[0.2em] mb-4 pl-3">
                Store Categories
              </p>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => scrollToCategory(cat._id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    activeCategory === cat._id
                      ? "bg-white border-white text-black shadow-lg"
                      : "bg-transparent border-transparent text-zinc-400 hover:text-white"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Main Product Grid */}
          <div className="lg:col-span-3 space-y-16">
            {categories.map((cat) => {
              const catProducts = productsByCategory[cat._id] || [];
              if (catProducts.length === 0) return null;

              return (
                <div
                  key={cat._id}
                  ref={(el) => {
                    categoryRefs.current[cat._id] = el;
                  }}
                  className="space-y-6 scroll-mt-24"
                >
                  <h2 className="text-lg font-black text-white border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    {cat.name}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {catProducts.map((product) => (
                      <div
                        key={product._id}
                        className="group relative rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.09] dark:bg-white/[0.02] backdrop-blur-md p-4 transition-all duration-300 flex flex-col justify-between hover:shadow-[0_0_20px_rgba(255,255,255,0.01)]"
                      >
                        {/* Subtle background glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02),transparent_70%)] pointer-events-none" />

                        <div className="space-y-3">
                          {/* Image Container */}
                          <div className="relative h-32 w-full rounded-xl bg-zinc-950/60 overflow-hidden flex items-center justify-center border border-white/[0.03]">
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
                            <h4 className="text-sm font-bold text-white tracking-tight leading-snug truncate">
                              {product.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500 mt-1 leading-normal line-clamp-2 h-8">
                              {product.description || "Premium assets secure deployment coordinate."}
                            </p>
                          </div>
                        </div>

                        {/* Price & Add to Cart button */}
                        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                          <div>
                            <p className="text-[8px] text-zinc-500 uppercase tracking-widest leading-none">Price</p>
                            <p className="text-white font-black text-sm mt-0.5">₹{product.price.toLocaleString()}</p>
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
                            className="h-8 px-3 rounded-lg bg-white hover:bg-zinc-200 text-black text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-md"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
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
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#09090B]/90 backdrop-blur-xl border-l border-white/[0.06] p-6 flex flex-col justify-between shadow-2xl"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-white" />
                    <h3 className="font-extrabold text-base text-white">Your Shopping Cart</h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 rounded-lg border border-white/[0.08] hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Cart list items */}
                {items.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400">Cart is empty</h4>
                      <p className="text-[10px] text-zinc-600 mt-1 max-w-xs mx-auto leading-normal">
                        Browse our storefront listings on the left and add assets to queue your escrow checkout.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="h-12 w-12 rounded-lg bg-zinc-950/60 flex items-center justify-center border border-white/[0.03] overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
                          ) : (
                            <span className="text-xl">🎁</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate leading-snug">{item.name}</h4>
                          <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">₹{item.price.toLocaleString()} each</p>
                        </div>

                        {/* Adjuster */}
                        <div className="flex items-center gap-2 border border-white/[0.05] bg-zinc-950/40 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-5 w-5 rounded hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-black text-white min-w-4 text-center select-none">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-5 w-5 rounded hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 flex items-center justify-center cursor-pointer transition-colors"
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
                <div className="border-t border-white/[0.05] pt-4 mt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 font-medium">Total Value:</span>
                    <span className="text-white font-black text-lg">₹{getTotalPrice().toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => handleTelegramCheckout(items, getTotalPrice())}
                    className="w-full h-11 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5"
                  >
                    <span>Submit Escrow Order</span>
                    <span className="text-[10px] text-zinc-500 font-semibold">(via Telegram)</span>
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

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, Minus, Trash2, X, AlertCircle, ArrowRight, ChevronLeft, ChevronRight, ScanQrCode, CreditCard, Coins, DollarSign, Globe, CircleDot, Loader2, MessageSquare, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useCartStore, CartItem } from "@/store/useCartStore";
import { handleTelegramCheckout } from "@/utils/checkout";
import { cn, getUserCountry } from "@/lib/utils";
import { PriceDisplay } from "@/components/price-display";
import { useCurrencyStore, Currency } from "@/store/useCurrencyStore";
import { createStorefrontOrderAction, createPokemonRequestAction, createCustomRequestAction } from "@/features/store/actions";
import { useSession } from "next-auth/react";
import { getFreshBalance } from "@/features/auth/actions";
import { getDb } from "@/lib/firestore";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { UpiPaymentCheckout } from "@/features/payments/components/upi-checkout";
import { PayPalPaymentCheckout } from "@/features/payments/components/paypal-checkout";
import { CryptoPaymentCheckout } from "@/features/payments/components/crypto-checkout";
import { WisePaymentCheckout } from "@/features/payments/components/wise-checkout";
import { AnimatedCardIcon, AnimatedCryptoIcon, PaypalIcon, WiseIcon } from "@/components/ui/animated-payment-icons";

interface Category {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  mrpPrice?: number;
  discountedPrice?: number;
  isLimitedDeal?: boolean;
  dealExpiry?: string | Date;
  badge?: "MOST_PURCHASED" | "POPULAR" | "";
  imageUrl: string;
  imageUrls?: string[];
  categoryId?: {
    _id: string;
    name: string;
    slug: string;
  };
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

interface StorefrontClientProps {
  categories: Category[];
  products: Product[];
  initialCategorySlug?: string;
}

export function StorefrontClient({ categories, products, initialCategorySlug }: StorefrontClientProps) {
  const { items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCartStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    if (initialCategorySlug) {
      const foundCategory = categories.find((cat) => cat.slug === initialCategorySlug);
      if (foundCategory) return foundCategory._id;
    }
    return null;
  });

  const handleSelectCategory = (catId: string | null) => {
    setSelectedCategoryId(catId);
    if (typeof window !== "undefined") {
      if (catId) {
        const foundCat = categories.find((c) => c._id === catId);
        if (foundCat?.slug) {
          console.log(`[Storefront] 📂 Category Selected -> "${foundCat.name}" (/store/${foundCat.slug})`);
          window.history.pushState({}, "", `/store/${foundCat.slug}`);
        }
      } else {
        console.log("[Storefront] 📂 Category Cleared -> Return to All Categories (/store)");
        window.history.pushState({}, "", "/store");
      }
    }
  };
  const [mounted, setMounted] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { convert } = useCurrencyStore();
  
  const { data: session, status } = useSession();
  const [freshBalance, setFreshBalance] = useState<number>(0);
  
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      getFreshBalance().then(bal => setFreshBalance(bal));
    }
  }, [status, session]);

  const walletBalance = freshBalance;
  const hasWalletCredit = walletBalance > 0;
  const walletCreditAmount = hasWalletCredit ? walletBalance : 0;

  // New interactive states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeGalleryProduct, setActiveGalleryProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [upiCheckoutData, setUpiCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [paypalCheckoutData, setPaypalCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [cryptoCheckoutData, setCryptoCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [wiseCheckoutData, setWiseCheckoutData] = useState<{ orderId: string; amount: number; currency: Currency; email: string } | null>(null);
  const [paymentStage, setPaymentStage] = useState<"methods" | "platforms" | "upi" | "paypal" | "crypto" | "wise">("methods");
  const [selectedMethod, setSelectedMethod] = useState<"UPI" | "Card" | "Crypto" | "PayPal" | "Wise" | "Others" | null>(null);
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);

  // Custom request states (Account, Stardust, XP)
  const [isCustomRequestModalOpen, setIsCustomRequestModalOpen] = useState(false);
  const [customRequestType, setCustomRequestType] = useState<"ACCOUNT" | "STARDUST" | "XP" | "RAIDSERVICE">("ACCOUNT");
  const [customRequesting, setCustomRequesting] = useState(false);
  const [customRequestError, setCustomRequestError] = useState<string | null>(null);
  const [customRequestSuccess, setCustomRequestSuccess] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const categorySlug = searchParams.get("category");
    const productId = searchParams.get("productId");

    if (categorySlug) {
      const foundCategory = categories.find((cat) => cat.slug === categorySlug);
      if (foundCategory) {
        setSelectedCategoryId(foundCategory._id);
        
        if (productId) {
          const foundProduct = products.find((p) => p._id === productId);
          if (foundProduct) {
            setSelectedProduct(foundProduct);
          }
        }
      }
    }
  }, [searchParams, categories, products]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [selectedCategoryId]);

  const handleAddItem = (product: Product) => {
    const isAccountOrPokemon = product.categoryId?.slug === "accounts" || product.categoryId?.slug === "pokemons";
    const existing = items.find((item) => item.id === product._id);
    if (isAccountOrPokemon && existing) {
      alert("⚠️ You can only purchase 1 account or Pokémon at a time.");
      return;
    }
    addItem({
      id: product._id,
      name: product.name,
      price: product.discountedPrice || product.price,
      imageUrl: product.imageUrl,
    });
  };

  const handleManualOrderChat = async (method: "Card" | "Others") => {
    if (status === "loading" || !session?.user) return;
    const userId = (session.user as any).id as string;
    const username = (session.user as any).username || session.user.name || session.user.email || "User";
    const country = getUserCountry(session.user);

    try {
      const res = await createStorefrontOrderAction(items, getTotalPrice());
      if (res.success && res.orderId) {
        const orderId = res.orderId;
        const db = getDb();
        const chatId = `order-${orderId}`;
        const chatRef = doc(db, "supportChats", chatId);

        const methodLabel = method === "Card" ? "Card, Cash App, Apple Pay" : "Others";
        
        const itemsList = items
          .map((item) => `- ${item.name} x ${item.quantity} (${convert(item.price).formatted} each)`)
          .join("\n");
        const totalPrice = getTotalPrice();
        const discount = Math.min(totalPrice, walletCreditAmount);
        const finalPrice = Math.max(0, totalPrice - discount);

        const formattedTotal = convert(totalPrice).formatted;
        const formattedDiscount = convert(discount).formatted;
        const formattedFinal = convert(finalPrice).formatted;

        const messageText = `📦 NEW ORDER: Storefront Purchase
----------------------------------
Order ID: ${orderId}
Items:
${itemsList}
Original Total: ${formattedTotal}
Credit Applied: -${formattedDiscount}
Adjusted Final Price: ${formattedFinal}
Payment Method: ${methodLabel}

👤 USER DETAILS:
----------------------------------
Username: ${username}
Email: ${session?.user?.email || "N/A"}
User ID: ${userId}
🌍 Country: ${country}

Please guide me on how to complete the payment!`;

        await setDoc(chatRef, {
          userId,
          username,
          email: session?.user?.email ?? "",
          type: "order",
          orderId,
          title: `Order #${orderId.substring(0, 8).toUpperCase()}`,
          lastMessage: `Payment coordination started for ${methodLabel}.`,
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: 1,
          unreadByUser: 0,
          createdAt: serverTimestamp(),
          paymentMethod: method,
        });

        const msgsRef = collection(db, "supportChats", chatId, "messages");
        await addDoc(msgsRef, {
          text: messageText,
          sender: "user",
          senderName: username,
          timestamp: serverTimestamp(),
          read: false,
        });

        await addDoc(msgsRef, {
          text: `System: Hi ${username}! Someone from our support team will reply to you here shortly to guide you through your manual payment.`,
          sender: "admin",
          senderName: "Support Team",
          timestamp: serverTimestamp(),
          read: false,
        });

        // Close modal, clear cart and redirect
        setIsCheckoutOpen(false);
        clearCart();
        window.location.href = `/chat?chatId=${chatId}`;
      } else {
        alert("Error creating order: " + (res.error || "Please try again."));
      }
    } catch (err) {
      console.error("Manual order chat error:", err);
      alert("Failed to initiate chat. Please try again.");
    }
  };


  // Group products by category ID
  const productsByCategory = categories.reduce((acc, cat) => {
    acc[cat._id] = products.filter((p) => p.categoryId?._id === cat._id);
    return acc;
  }, {} as Record<string, Product[]>);

  const selectedCategoryObj = categories.find((cat) => cat._id === selectedCategoryId);
  const catProducts = selectedCategoryId ? (productsByCategory[selectedCategoryId] || []) : [];

  return (
    <div className="relative min-h-screen bg-transparent text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Top action/cart bar */}
      <div className="sticky top-[53px] z-40 w-full bg-white dark:bg-[#111111] border-b border-zinc-200 dark:border-white/[0.06] py-4 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Direct Storefront
            </h1>
            <p className="text-xs text-zinc-500 mt-1">Sleek Pokémon GO services & asset checkout</p>
          </div>

          {/* Floating Cart Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative h-8 px-3.5 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 hover:bg-zinc-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-800 dark:text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shrink-0"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>View Cart</span>
            {mounted && getTotalItems() > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-semibold flex items-center justify-center animate-pulse">
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
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Select a Category</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose one of our premium direct service categories to browse and purchase gaming assets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
              {categories.map((cat) => {
                const count = productsByCategory[cat._id]?.length || 0;
                return (
                  <div
                    key={cat._id}
                    onClick={() => handleSelectCategory(cat._id)}
                    className={cn(
                      "group relative rounded-lg border border-zinc-200 dark:border-white/[0.06] overflow-hidden flex flex-col justify-between h-56 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.1] cursor-pointer",
                      cat.imageUrl ? "" : "p-6 bg-white dark:bg-[#111111]"
                    )}
                  >
                    {/* Background image if available */}
                    {cat.imageUrl && (
                      <>
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-102"
                          style={{ backgroundImage: `url(${cat.imageUrl})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                      </>
                    )}

                    <div className={cn("relative space-y-4", cat.imageUrl ? "p-6" : "")}>
                      {/* Icon / no-image emoji */}
                      {!cat.imageUrl && (
                        <div className="h-10 w-10 rounded-md bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-xl group-hover:scale-105 transition-transform duration-300">
                          {cat.slug === "accounts" ? "🎮" : cat.slug === "stardust" ? "✨" : cat.slug === "coins" ? "🪙" : cat.slug === "items" ? "🎒" : "⭐"}
                        </div>
                      )}

                      <div>
                        <h3 className={cn("text-base font-semibold tracking-tight", cat.imageUrl ? "text-white" : "text-zinc-900 dark:text-white")}>{cat.name}</h3>
                        <p className={cn("text-[10px] mt-1 tracking-wider uppercase font-semibold", cat.imageUrl ? "text-white/60" : "text-zinc-450 dark:text-zinc-500")}>
                          {count} {count === 1 ? "listing" : "listings"} ready
                        </p>
                      </div>
                    </div>

                    <span className={cn("relative text-xs font-semibold group-hover:translate-x-1 transition-transform duration-300 inline-flex items-center gap-1.5 self-start", cat.imageUrl ? "p-6 pt-0 text-white" : "text-zinc-900 dark:text-white")}>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-white/[0.06] pb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSelectCategory(null)}
                  className="h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/[0.04] text-zinc-655 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95 shadow-xs"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tracking-wider uppercase font-semibold block">Direct Storefront</span>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                    {selectedCategoryObj?.name}
                  </h2>
                </div>
              </div>

              {selectedCategoryObj?.slug === "pokemons" && (
                <button
                  onClick={() => {
                    if (!session?.user) {
                      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                    } else {
                      setIsRequestModalOpen(true);
                    }
                  }}
                  className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] self-start sm:self-auto shadow-xs"
                >
                  ★ Request a Pokémon
                </button>
              )}

              {selectedCategoryObj?.slug === "accounts" && (
                <button
                  onClick={() => {
                    if (!session?.user) {
                      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                    } else {
                      setCustomRequestType("ACCOUNT");
                      setIsCustomRequestModalOpen(true);
                    }
                  }}
                  className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] self-start sm:self-auto shadow-xs"
                >
                  ★ Request Custom Account
                </button>
              )}

              {selectedCategoryObj?.slug === "stardust" && (
                <button
                  onClick={() => {
                    if (!session?.user) {
                      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                    } else {
                      setCustomRequestType("STARDUST");
                      setIsCustomRequestModalOpen(true);
                    }
                  }}
                  className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] self-start sm:self-auto shadow-xs"
                >
                  ★ Request Custom Stardust
                </button>
              )}

              {(selectedCategoryObj?.slug === "xp" || selectedCategoryObj?.slug === "") && (
                <button
                  onClick={() => {
                    if (!session?.user) {
                      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                    } else {
                      setCustomRequestType("XP");
                      setIsCustomRequestModalOpen(true);
                    }
                  }}
                  className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] self-start sm:self-auto shadow-xs"
                >
                  ★ Request Custom XP
                </button>
              )}

              {(selectedCategoryObj?.slug === "raidservice" || 
                selectedCategoryObj?.slug === "raid-services" || 
                selectedCategoryObj?.slug === "raids" || 
                selectedCategoryObj?.slug === "raid" || 
                selectedCategoryObj?.slug === "raidservices") && (
                <button
                  onClick={() => {
                    if (!session?.user) {
                      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                    } else {
                      setCustomRequestType("RAIDSERVICE");
                      setIsCustomRequestModalOpen(true);
                    }
                  }}
                  className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] self-start sm:self-auto shadow-xs"
                >
                  ★ Request Custom Raid Service
                </button>
              )}
            </div>

            {/* Product list */}
            {catProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111]">
                <AlertCircle className="h-7 w-7 text-zinc-400" />
                <p className="text-xs text-zinc-500">No storefront services available under this category at the moment.</p>
                <button
                  onClick={() => handleSelectCategory(null)}
                  className="h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold transition-all active:scale-95"
                >
                  Return to Categories
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {catProducts.map((product) => (
                  <div
                    key={product._id}
                    className="group relative rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-4 transition-all duration-250 flex flex-col justify-between hover:shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.1]"
                  >
                    <div
                      onClick={() => {
                        console.log(`[Storefront] 🎁 Product Card Clicked -> "${product.name}" (ID: ${product._id}, Price: $${product.price})`);
                        setSelectedProduct(product);
                      }}
                      className="space-y-3 relative cursor-pointer group/card"
                    >
                      {/* Badge (Most Purchased / Popular) */}
                      {product.badge && (
                        <div className={cn(
                          "absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white shadow-xs",
                          product.badge === "MOST_PURCHASED" ? "bg-amber-500" : "bg-purple-600"
                        )}>
                          {product.badge === "MOST_PURCHASED" ? "Most Purchased" : "Popular"}
                        </div>
                      )}

                      {/* Image Container */}
                      <div
                        className="relative h-52 w-full rounded-md bg-zinc-50 dark:bg-black/20 overflow-hidden flex items-center justify-center border border-zinc-200 dark:border-white/[0.06] group-hover/card:border-zinc-300 dark:group-hover/card:border-white/[0.12] transition-colors"
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain group-hover/card:scale-102 transition-transform duration-500 animate-in fade-in"
                          />
                        ) : (
                          <span className="text-3xl select-none">🎁</span>
                        )}

                        {/* Limited Time Deal Countdown */}
                        {product.isLimitedDeal && product.dealExpiry && (
                          <CountdownTimer expiry={product.dealExpiry} />
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white px-2.5 py-1 rounded-md font-bold shadow-xs">View Details</span>
                        </div>
                      </div>

                      {/* Detail */}
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white tracking-tight leading-snug truncate group-hover/card:text-[#6133e1] dark:group-hover/card:text-purple-400 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-normal line-clamp-2 h-8">
                          {product.description || "Premium assets secure deployment coordinate."}
                        </p>
                      </div>
                    </div>

                    {/* Price & Add to Cart button */}
                    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
                      <div>
                        {product.mrpPrice && product.discountedPrice && product.mrpPrice > product.discountedPrice ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 line-through">
                                <PriceDisplay amountInUSD={product.mrpPrice} />
                              </span>
                              <span className="text-[9px] font-bold text-red-500 dark:text-red-400 bg-red-500/10 px-1 rounded">
                                {Math.round(((product.mrpPrice - product.discountedPrice) / product.mrpPrice) * 100)}% OFF
                              </span>
                            </div>
                            <p className="text-zinc-900 dark:text-white font-bold text-xs">
                              <PriceDisplay amountInUSD={product.discountedPrice} />
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Price</p>
                            <p className="text-zinc-900 dark:text-white font-semibold text-xs mt-0.5">
                              <PriceDisplay amountInUSD={product.price} />
                            </p>
                          </div>
                        )}
                      </div>

                      {(() => {
                        const cartItem = items.find((item) => item.id === product._id);
                        const isAccountOrPokemon = product.categoryId?.slug === "accounts" || product.categoryId?.slug === "pokemons";
                        if (cartItem) {
                          return (
                            <div className="flex items-center gap-1.5 border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02] rounded-md p-0.5">
                              <button
                                onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}
                                className="h-6 w-6 rounded-md bg-zinc-200 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 text-zinc-655 dark:text-zinc-355 hover:text-zinc-955 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                              <span className="text-xs font-semibold text-zinc-900 dark:text-white min-w-4 text-center select-none px-0.5">
                                {cartItem.quantity}
                              </span>
                              {!isAccountOrPokemon && (
                                <button
                                  onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}
                                  className="h-6 w-6 rounded-md bg-zinc-200 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 text-zinc-655 dark:text-zinc-355 hover:text-zinc-955 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                          );
                        }
                        return (
                          <button
                            onClick={() => {
                              const finalPrice = product.discountedPrice || product.price;
                              console.log(`[Storefront] 🛒 "Add to Cart" Clicked -> "${product.name}" (ID: ${product._id}, Price: $${finalPrice})`);
                              addItem({
                                id: product._id,
                                name: product.name,
                                price: finalPrice,
                                imageUrl: product.imageUrl,
                              });
                            }}
                            className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
                          >
                            Add to Cart
                          </button>
                        );
                      })()}
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
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#111111] border-l border-zinc-200 dark:border-white/[0.06] p-6 flex flex-col justify-between shadow-xl transition-colors duration-300"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-zinc-900 dark:text-white" />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Your Shopping Cart</h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 rounded-md border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-white/[0.04] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Cart list items */}
                {items.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <AlertCircle className="h-8 w-8 text-zinc-400 dark:text-zinc-650 mx-auto" />
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-500">Cart is empty</h4>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1 max-w-xs mx-auto leading-normal">
                        Browse our storefront listings on the left and add assets to queue your checkout.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                    {items.map((item) => {
                      const itemProduct = products.find((p) => p._id === item.id);
                      const isLimitedItem = itemProduct?.categoryId?.slug === "accounts" || itemProduct?.categoryId?.slug === "pokemons";
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-md border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/10 hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="h-12 w-12 rounded-md bg-zinc-200 dark:bg-zinc-955/60 flex items-center justify-center border border-zinc-200 dark:border-white/[0.06] overflow-hidden shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <span className="text-xl">🎁</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-zinc-900 dark:text-white truncate leading-snug">{item.name}</h4>
                            <p className="text-[10px] text-zinc-500 font-semibold mt-0.5"><PriceDisplay amountInUSD={item.price} /> each</p>
                          </div>

                          {/* Adjuster */}
                          <div className="flex items-center gap-2 border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02] rounded-md p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-5 w-5 rounded-md hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-550 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-semibold text-zinc-900 dark:text-white min-w-4 text-center select-none">{item.quantity}</span>
                            {!isLimitedItem && (
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-5 w-5 rounded-md hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-550 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-500/5 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drawer footer layout */}
              {items.length > 0 && (
                <div className="border-t border-zinc-200 dark:border-white/[0.06] pt-4 mt-6 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium">Subtotal:</span>
                    <span className="text-zinc-900 dark:text-white font-semibold"><PriceDisplay amountInUSD={getTotalPrice()} /></span>
                  </div>
                  {hasWalletCredit && (
                    <div className="flex items-center justify-between text-xs text-emerald-500">
                      <span className="font-medium">Wallet Credit Applied:</span>
                      <span className="font-semibold">-{convert(Math.min(getTotalPrice(), walletCreditAmount)).formatted}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 font-semibold">Total Price:</span>
                    <span className="text-zinc-900 dark:text-white font-semibold text-lg">
                      <PriceDisplay amountInUSD={Math.max(0, getTotalPrice() - Math.min(getTotalPrice(), walletCreditAmount))} />
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (status === "loading") return;
                      if (!session?.user) {
                        window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                      } else {
                        setIsCheckoutOpen(true);
                      }
                    }}
                    disabled={status === "loading"}
                    className="w-full h-10 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-65"
                  >
                    <span>Checkout / Buy Now</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Payment Modal */}
      {isCheckoutOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (upiCheckoutData || paypalCheckoutData || cryptoCheckoutData || wiseCheckoutData) {
                clearCart();
                setUpiCheckoutData(null);
                setPaypalCheckoutData(null);
                setCryptoCheckoutData(null);
                setWiseCheckoutData(null);
              }
              setPaymentStage("methods");
              setSelectedMethod(null);
              setIsCheckoutOpen(false);
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            className={cn(
              "relative w-full rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 shadow-xl space-y-6 text-zinc-900 dark:text-white transition-all duration-300 cursor-default overflow-y-auto max-h-[95vh] scrollbar-thin",
              (paymentStage === "upi" || paymentStage === "paypal" || paymentStage === "crypto" || paymentStage === "wise") ? "max-w-4xl" : "max-w-3xl"
            )}
          >
            
            {/* Close Button */}
            <button
              onClick={() => {
                if (upiCheckoutData || paypalCheckoutData || cryptoCheckoutData || wiseCheckoutData) {
                  clearCart();
                  setUpiCheckoutData(null);
                  setPaypalCheckoutData(null);
                  setCryptoCheckoutData(null);
                  setWiseCheckoutData(null);
                }
                setPaymentStage("methods");
                setSelectedMethod(null);
                setIsCheckoutOpen(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none"
            >
              <X className="h-5 w-5" />
            </button>

            {/* STAGE 1: WISE CHECKOUT GATEWAY */}
            {paymentStage === "wise" && wiseCheckoutData ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="h-4.5 w-4.5 text-emerald-500" />
                    Wise Secure Gate
                  </h3>
                  <button
                    onClick={() => {
                      setWiseCheckoutData(null);
                      setPaymentStage("methods");
                    }}
                    className="text-[10px] font-bold text-zinc-500 hover:text-emerald-500 cursor-pointer bg-transparent border-none transition-colors"
                  >
                    Change Method
                  </button>
                </div>
                <WisePaymentCheckout
                  orderId={wiseCheckoutData.orderId}
                  amount={wiseCheckoutData.amount}
                  currency={wiseCheckoutData.currency}
                  customerEmail={wiseCheckoutData.email}
                  walletDiscountApplied={Math.min(getTotalPrice(), walletCreditAmount)}
                  originalTotalPrice={getTotalPrice()}
                />
              </div>
            ) : paymentStage === "crypto" && cryptoCheckoutData ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Coins className="h-4.5 w-4.5 text-amber-500" />
                    Crypto Secure Gate
                  </h3>
                  <button
                    onClick={() => {
                      setCryptoCheckoutData(null);
                      setPaymentStage("methods");
                    }}
                    className="text-[10px] font-bold text-zinc-500 hover:text-amber-500 cursor-pointer bg-transparent border-none transition-colors"
                  >
                    Change Method
                  </button>
                </div>
                <CryptoPaymentCheckout
                  orderId={cryptoCheckoutData.orderId}
                  amount={cryptoCheckoutData.amount}
                  customerEmail={cryptoCheckoutData.email}
                  walletDiscountApplied={Math.min(getTotalPrice(), walletCreditAmount)}
                  originalTotalPrice={getTotalPrice()}
                />
              </div>
            ) : paymentStage === "paypal" && paypalCheckoutData ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <DollarSign className="h-4.5 w-4.5 text-blue-500" />
                    PayPal Secure Gate
                  </h3>
                  <button
                    onClick={() => {
                      setPaypalCheckoutData(null);
                      setPaymentStage("methods");
                    }}
                    className="text-[10px] font-bold text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer bg-transparent border-none transition-colors"
                  >
                    Change Method
                  </button>
                </div>
                <PayPalPaymentCheckout
                  orderId={paypalCheckoutData.orderId}
                  amount={paypalCheckoutData.amount}
                  customerEmail={paypalCheckoutData.email}
                  walletDiscountApplied={Math.min(getTotalPrice(), walletCreditAmount)}
                  originalTotalPrice={getTotalPrice()}
                />
              </div>
            ) : paymentStage === "upi" && upiCheckoutData ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <ScanQrCode className="h-4.5 w-4.5 text-[#6133e1]" />
                    UPI Pay Gate
                  </h3>
                  <button
                    onClick={() => {
                      setUpiCheckoutData(null);
                      setPaymentStage("methods");
                    }}
                    className="text-[10px] font-bold text-zinc-500 hover:text-[#6133e1] dark:hover:text-purple-400 cursor-pointer bg-transparent border-none transition-colors"
                  >
                    Change Method
                  </button>
                </div>
                <UpiPaymentCheckout
                  orderId={upiCheckoutData.orderId}
                  amount={upiCheckoutData.amount}
                  customerEmail={upiCheckoutData.email}
                  walletDiscountApplied={Math.min(getTotalPrice(), walletCreditAmount)}
                  originalTotalPrice={getTotalPrice()}
                />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="space-y-1.5 text-left">
                  <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-zinc-900 dark:text-white" />
                    Complete Checkout
                  </h2>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400">
                    {getTotalPrice() - Math.min(getTotalPrice(), walletCreditAmount) <= 0 
                      ? "Your wallet balance fully covers this purchase. No external gateway payment is required!" 
                      : "Choose your preferred payment method below. The total price is:"}
                  </p>
                  {hasWalletCredit && (
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-550 flex items-center gap-1.5 mt-1">
                      <span>Subtotal: <PriceDisplay amountInUSD={getTotalPrice()} /></span>
                      <span>•</span>
                      <span className="text-emerald-500 font-semibold">Credit: -<PriceDisplay amountInUSD={Math.min(getTotalPrice(), walletCreditAmount)} /></span>
                    </div>
                  )}
                  <div className="text-xl font-bold text-zinc-900 dark:text-white pt-1">
                    <PriceDisplay amountInUSD={Math.max(0, getTotalPrice() - Math.min(getTotalPrice(), walletCreditAmount))} />
                  </div>
                </div>

                {getTotalPrice() - Math.min(getTotalPrice(), walletCreditAmount) <= 0 ? (
                  <div className="pt-4">
                    <button
                      onClick={async () => {
                        setLoadingMethod("WALLET");
                        try {
                          const res = await createStorefrontOrderAction(items, getTotalPrice());
                          if (res.success && res.orderId) {
                            const orderId = res.orderId;
                            const userId = (session?.user as any)?.id as string || "N/A";
                            const username = (session?.user as any)?.username || session?.user?.name || session?.user?.email || "User";
                            const country = getUserCountry(session?.user);
                            const db = getDb();
                            const chatId = `order-${orderId}`;
                            const chatRef = doc(db, "supportChats", chatId);

                            const messageText = `📦 ORDER COMPLETED (Paid via Wallet)
----------------------------------
Order ID: ${orderId}
Subtotal Price: $${getTotalPrice().toFixed(2)} USD
Wallet Balance Applied: $${getTotalPrice().toFixed(2)} USD
Remaining Amount Paid: $0.00 USD
Payment Method: Wallet Balance (Full Credit)

👤 USER DETAILS:
----------------------------------
Username: ${username}
Email: ${session?.user?.email || "N/A"}
User ID: ${userId}
🌍 Country: ${country}

This order has been completed automatically using your wallet balance. Admin will coordinate asset delivery here shortly!`;

                            await setDoc(chatRef, {
                              userId,
                              username,
                              email: session?.user?.email ?? "",
                              type: "order",
                              orderId,
                              title: `Order #${orderId.substring(0, 8).toUpperCase()}`,
                              lastMessage: "Paid automatically via wallet credit.",
                              lastMessageAt: serverTimestamp(),
                              unreadByAdmin: 1,
                              unreadByUser: 0,
                              createdAt: serverTimestamp(),
                              paymentMethod: "Wallet",
                            });

                            const msgsRef = collection(db, "supportChats", chatId, "messages");
                            await addDoc(msgsRef, {
                              text: messageText,
                              sender: "user",
                              senderName: username,
                              timestamp: serverTimestamp(),
                              read: false,
                            });

                            await addDoc(msgsRef, {
                              text: `System: Order #${orderId.substring(0, 8).toUpperCase()} has been successfully created and fully paid via wallet balance. Support representative will deliver your items soon!`,
                              sender: "admin",
                              senderName: "Support Team",
                              timestamp: serverTimestamp(),
                              read: false,
                            });

                            useCartStore.getState().clearCart();
                            window.location.href = `/chat?chatId=${chatId}`;
                          } else {
                            alert("Error: " + (res.error || "Failed to complete order"));
                          }
                        } catch (err) {
                          console.error("Wallet checkout error:", err);
                          alert("Failed to pay using wallet balance. Please try again.");
                        } finally {
                          setLoadingMethod(null);
                        }
                      }}
                      disabled={loadingMethod !== null}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMethod === "WALLET" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirm Wallet Purchase ($0.00)"
                      )}
                    </button>
                  </div>
                ) : (
                  /* 6 Payment Methods Grid */
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* 1. UPI */}
                  <button
                    onClick={async () => {
                      setLoadingMethod("UPI");
                      try {
                        const res = await createStorefrontOrderAction(items, getTotalPrice());
                        if (res.success && res.orderId) {
                          const totalPrice = getTotalPrice();
                          const discount = Math.min(totalPrice, walletCreditAmount);
                          const finalPrice = Math.max(0, totalPrice - discount);
                          const inrRate = useCurrencyStore.getState().rates.INR || 83.5;
                          const amountInINR = Math.round(finalPrice * inrRate);

                          setUpiCheckoutData({
                            orderId: res.orderId,
                            amount: amountInINR,
                            email: session?.user?.email || "customer@store.com",
                          });
                          setSelectedMethod("UPI");
                          setPaymentStage("upi");
                        } else {
                          alert("Error: " + (res.error || "Failed to create order"));
                        }
                      } catch (err) {
                        console.error("UPI checkout error:", err);
                        alert("Failed to initiate UPI transaction. Please try again.");
                      } finally {
                        setLoadingMethod(null);
                      }
                    }}
                    disabled={loadingMethod !== null}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                      loadingMethod !== null
                        ? "opacity-55 cursor-not-allowed"
                        : "hover:border-[#6133e1] dark:hover:border-[#6133e1]/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#6133e1]/10 text-[#6133e1] dark:bg-[#6133e1]/20">
                        {loadingMethod === "UPI" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ScanQrCode className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">UPI Transfer</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {loadingMethod === "UPI" ? "Generating UPI Gate..." : "Zero fee instant payments"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-[#6133e1]/10 text-[#6133e1] dark:text-violet-400 px-2 py-0.5 rounded-full font-bold uppercase border border-[#6133e1]/10">Instant</span>
                    </div>
                  </button>

                  {/* 2. Credit Card */}
                  <button
                    onClick={async () => {
                      setLoadingMethod("Card");
                      try {
                        await handleManualOrderChat("Card");
                      } finally {
                        setLoadingMethod(null);
                      }
                    }}
                    disabled={loadingMethod !== null}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                      loadingMethod !== null
                        ? "opacity-55 cursor-not-allowed"
                        : "hover:border-blue-500 dark:hover:border-blue-500/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                        {loadingMethod === "Card" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <AnimatedCardIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Card, Cash App, Apple Pay</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {loadingMethod === "Card" ? "Opening support chat..." : "Global card processing"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase border border-blue-500/10">Manual</span>
                    </div>
                  </button>

                  {/* 3. Crypto */}
                  <button
                    onClick={async () => {
                      setLoadingMethod("Crypto");
                      try {
                        const res = await createStorefrontOrderAction(items, getTotalPrice());
                        if (res.success && res.orderId) {
                          const totalPrice = getTotalPrice();
                          const discount = Math.min(totalPrice, walletCreditAmount);
                          const finalPriceUSD = Math.max(0, totalPrice - discount);

                          setCryptoCheckoutData({
                            orderId: res.orderId,
                            amount: finalPriceUSD,
                            email: session?.user?.email || "customer@store.com",
                          });
                          setSelectedMethod("Crypto");
                          setPaymentStage("crypto");
                        } else {
                          alert("Error: " + (res.error || "Failed to create order"));
                        }
                      } catch (err) {
                        console.error("Crypto checkout error:", err);
                        alert("Failed to initiate Crypto transaction. Please try again.");
                      } finally {
                        setLoadingMethod(null);
                      }
                    }}
                    disabled={loadingMethod !== null}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                      loadingMethod !== null
                        ? "opacity-55 cursor-not-allowed"
                        : "hover:border-amber-500 dark:hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                        {loadingMethod === "Crypto" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <AnimatedCryptoIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Crypto</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {loadingMethod === "Crypto" ? "Generating Crypto Gate..." : "Secure USDT, BTC, ETH"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-500/10">Instant</span>
                    </div>
                  </button>

                  {/* 4. PayPal */}
                  <button
                    onClick={async () => {
                      setLoadingMethod("PayPal");
                      try {
                        const res = await createStorefrontOrderAction(items, getTotalPrice());
                        if (res.success && res.orderId) {
                          const totalPrice = getTotalPrice();
                          const discount = Math.min(totalPrice, walletCreditAmount);
                          const finalPriceUSD = Math.max(0, totalPrice - discount);
                          const eurRate = useCurrencyStore.getState().rates.EUR || 0.92;
                          const amountInEUR = Math.round(finalPriceUSD * eurRate * 100) / 100;

                          setPaypalCheckoutData({
                            orderId: res.orderId,
                            amount: amountInEUR,
                            email: session?.user?.email || "customer@store.com",
                          });
                          setSelectedMethod("PayPal");
                          setPaymentStage("paypal");
                        } else {
                          alert("Error: " + (res.error || "Failed to create order"));
                        }
                      } catch (err) {
                        console.error("PayPal checkout error:", err);
                        alert("Failed to initiate PayPal transaction. Please try again.");
                      } finally {
                        setLoadingMethod(null);
                      }
                    }}
                    disabled={loadingMethod !== null}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                      loadingMethod !== null
                        ? "opacity-55 cursor-not-allowed"
                        : "hover:border-sky-500 dark:hover:border-sky-500/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                        {loadingMethod === "PayPal" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <PaypalIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">PayPal</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {loadingMethod === "PayPal" ? "Generating PayPal Gate..." : "Global instant verification"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-sky-500/10 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-full font-bold uppercase border border-sky-500/10">Instant</span>
                    </div>
                  </button>

                  {/* 5. Wise */}
                  {(() => {
                    const totalPrice = getTotalPrice();
                    const discount = Math.min(totalPrice, walletCreditAmount);
                    const finalPriceUSD = Math.max(0, totalPrice - discount);
                    const isWiseDisabled = finalPriceUSD < 5.00;

                    return (
                      <button
                        onClick={async () => {
                          if (isWiseDisabled) return;
                          setLoadingMethod("Wise");
                          try {
                            const res = await createStorefrontOrderAction(items, getTotalPrice());
                            if (res.success && res.orderId) {
                              const selectedCurrency = useCurrencyStore.getState().currency;
                              const rate = useCurrencyStore.getState().rates[selectedCurrency] || 1.0;
                              const amountInSelected = Math.round(finalPriceUSD * rate * 100) / 100;

                              setWiseCheckoutData({
                                orderId: res.orderId,
                                amount: amountInSelected,
                                currency: selectedCurrency,
                                email: session?.user?.email || "customer@store.com",
                              });
                              setSelectedMethod("Wise");
                              setPaymentStage("wise");
                            } else {
                              alert("Error: " + (res.error || "Failed to create order"));
                            }
                          } catch (err) {
                            console.error("Wise checkout error:", err);
                            alert("Failed to initiate Wise transaction. Please try again.");
                          } finally {
                            setLoadingMethod(null);
                          }
                        }}
                        disabled={isWiseDisabled || loadingMethod !== null}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                          (isWiseDisabled || loadingMethod !== null)
                            ? "opacity-55 cursor-not-allowed"
                            : "hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                            {loadingMethod === "Wise" ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <WiseIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Wise</span>
                            <span className={cn("text-[10px] font-medium block", isWiseDisabled ? "text-red-500" : "text-zinc-500 dark:text-zinc-400")}>
                              {loadingMethod === "Wise" ? "Generating Wise Gate..." : isWiseDisabled ? "Min $5.00 required" : "Direct international transfer"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border",
                            isWiseDisabled
                              ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/10"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          )}>
                            {isWiseDisabled ? "Disabled" : "Instant"}
                          </span>
                        </div>
                      </button>
                    );
                  })()}

                  {/* 6. Others */}
                  <button
                    onClick={async () => {
                      setLoadingMethod("Others");
                      try {
                        await handleManualOrderChat("Others");
                      } finally {
                        setLoadingMethod(null);
                      }
                    }}
                    disabled={loadingMethod !== null}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 transition text-left w-full group shadow-xs",
                      loadingMethod !== null
                        ? "opacity-55 cursor-not-allowed"
                        : "hover:border-zinc-455 dark:hover:border-zinc-400/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500 dark:bg-zinc-500/20">
                        {loadingMethod === "Others" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <CircleDot className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Others</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {loadingMethod === "Others" ? "Opening support chat..." : "Payoneer, Alipay, Custom chat"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 px-2 py-0.5 rounded-full font-bold uppercase">Manual</span>
                    </div>
                  </button>

                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex items-center justify-center text-[10px] text-zinc-450 dark:text-zinc-500">
                      <span>🔒 Secured &amp; encrypted manual payment system</span>
                    </div>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/65 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#09090B] p-6 md:p-8 shadow-2xl space-y-6 text-zinc-900 dark:text-white flex flex-col md:flex-row gap-8 scrollbar-thin">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Column: Image Container (Clickable for fullscreen) */}
            <div className="w-full md:w-1/2 flex flex-col gap-3">
              <div
                onClick={() => {
                  setActiveGalleryProduct(selectedProduct);
                  setActiveImageIndex(0);
                }}
                className="relative aspect-square w-full rounded-lg bg-zinc-50 dark:bg-black/20 overflow-hidden flex items-center justify-center border border-zinc-200 dark:border-white/[0.06] cursor-pointer hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors group"
                title="Click to view full screen"
              >
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-102 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-5xl select-none">🎁</span>
                )}
                
                {/* Zoom indicator overlay */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white px-2.5 py-1 rounded-md font-bold shadow-xs">Click to view full screen</span>
                </div>
              </div>

              {/* Thumbnails if available */}
              {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {selectedProduct.imageUrls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedProduct({ ...selectedProduct, imageUrl: url });
                      }}
                      className={cn(
                        "h-12 w-12 rounded-md border overflow-hidden flex items-center justify-center shrink-0 cursor-pointer transition-all bg-white dark:bg-black",
                        selectedProduct.imageUrl === url ? "border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white" : "border-zinc-200 dark:border-zinc-850 hover:border-zinc-400 dark:hover:border-zinc-700"
                      )}
                    >
                      <img src={url} className="object-contain max-h-full max-w-full" alt="thumbnail" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Detailed Product Info */}
            <div className="w-full md:w-1/2 flex flex-col justify-between space-y-4 pt-4 md:pt-0">
              <div className="space-y-3">
                {/* Category & Badge */}
                <div className="flex flex-wrap gap-2 items-center">
                  {selectedProduct.categoryId && (
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.04] text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06]">
                      {selectedProduct.categoryId.name}
                    </span>
                  )}
                  {selectedProduct.badge && (
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white shadow-xs",
                      selectedProduct.badge === "MOST_PURCHASED" ? "bg-amber-500" : "bg-purple-600"
                    )}>
                      {selectedProduct.badge === "MOST_PURCHASED" ? "Most Purchased" : "Popular"}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight leading-snug">
                  {selectedProduct.name}
                </h2>

                {/* Full Description */}
                <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-h-[160px] overflow-y-auto pr-1">
                  {selectedProduct.description || "No detailed description available for this premium storefront product."}
                </div>
              </div>

              {/* Pricing & Add to Cart */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/[0.04]">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide">Price</span>
                  <div>
                    {selectedProduct.mrpPrice && selectedProduct.discountedPrice && selectedProduct.mrpPrice > selectedProduct.discountedPrice ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 line-through">
                            <PriceDisplay amountInUSD={selectedProduct.mrpPrice} />
                          </span>
                          <span className="text-[9px] font-bold text-red-500 dark:text-red-400 bg-red-500/10 px-1 rounded">
                            {Math.round(((selectedProduct.mrpPrice - selectedProduct.discountedPrice) / selectedProduct.mrpPrice) * 100)}% OFF
                          </span>
                        </div>
                        <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                          <PriceDisplay amountInUSD={selectedProduct.discountedPrice} />
                        </p>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-zinc-900 dark:text-white">
                        <PriceDisplay amountInUSD={selectedProduct.price} />
                      </p>
                    )}
                  </div>
                </div>

                {/* Add to Cart Actions */}
                <div className="flex items-center gap-3 w-full">
                  {(() => {
                    const cartItem = items.find((item) => item.id === selectedProduct._id);
                    const isAccountOrPokemon = selectedProduct.categoryId?.slug === "accounts" || selectedProduct.categoryId?.slug === "pokemons";
                    if (cartItem) {
                      return (
                        <div className="flex items-center justify-between border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02] rounded-lg p-1 w-full">
                          <span className="text-xs font-semibold px-3 text-zinc-500">In Cart</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(selectedProduct._id, cartItem.quantity - 1)}
                              className="h-8 w-8 rounded-md bg-zinc-200 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 text-zinc-650 dark:text-zinc-350 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white min-w-6 text-center select-none">
                              {cartItem.quantity}
                            </span>
                            {!isAccountOrPokemon && (
                              <button
                                onClick={() => updateQuantity(selectedProduct._id, cartItem.quantity + 1)}
                                className="h-8 w-8 rounded-md bg-zinc-200 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 text-zinc-655 dark:text-zinc-355 hover:text-zinc-955 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={() => handleAddItem(selectedProduct)}
                        className="w-full h-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="h-4 w-4" /> Add to Cart
                      </button>
                    );
                  })()}
                </div>
                
                {/* Inquiry Box */}
                <div className="mt-4 p-3 rounded-lg border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 flex items-start gap-3">
                  <div className="mt-0.5 text-indigo-600 dark:text-indigo-400">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-0.5">Need more details about product or price?</h4>
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-400/80 leading-relaxed">
                      If you have questions about this item, or want to make a custom offer, please {" "}
                      <Link href="/chat" className="font-bold underline underline-offset-2 hover:text-indigo-500 transition-colors">
                        create a support ticket
                      </Link>.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Product Image Gallery Slider Lightbox */}
      {activeGalleryProduct && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-between p-6 bg-black/95 backdrop-blur-xs animate-in fade-in duration-200">
          
          {/* Top Panel: Title & Close Button */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="space-y-1 text-left">
              <h3 className="font-bold text-sm text-white tracking-tight leading-snug">
                {activeGalleryProduct.name}
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold">Image {activeImageIndex + 1} of {((activeGalleryProduct.imageUrls && activeGalleryProduct.imageUrls.length > 0) ? activeGalleryProduct.imageUrls.length : 1)}</p>
            </div>
            
            <button
              onClick={() => { setActiveGalleryProduct(null); setIsZoomed(false); }}
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Centered Image Container - Takes full height minus header & footer */}
          <div className={cn(
            "relative flex-1 w-full flex items-center justify-center my-6 overflow-hidden",
            isZoomed ? "overflow-auto p-4" : ""
          )}>
            {(() => {
              const urls = (activeGalleryProduct.imageUrls && activeGalleryProduct.imageUrls.length > 0) 
                ? activeGalleryProduct.imageUrls 
                : [activeGalleryProduct.imageUrl];
              const currentUrl = urls[activeImageIndex] || activeGalleryProduct.imageUrl;
              return (
                <img
                  src={currentUrl}
                  alt={activeGalleryProduct.name}
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={cn(
                    "select-none animate-in zoom-in-95 duration-200 transition-all origin-center max-h-[80vh] max-w-[90vw] object-contain",
                    isZoomed 
                      ? "max-h-none max-w-none cursor-zoom-out scale-150" 
                      : "cursor-zoom-in"
                  )}
                />
              );
            })()}

            {/* Prev / Next buttons if multiple (positioned on left/right screen edges) */}
            {((activeGalleryProduct.imageUrls && activeGalleryProduct.imageUrls.length > 1) || false) && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const total = activeGalleryProduct.imageUrls?.length || 1;
                    setActiveImageIndex((prev) => (prev - 1 + total) % total);
                    setIsZoomed(false);
                  }}
                  className="absolute left-4 h-12 w-12 rounded-full border border-white/10 bg-black/50 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg z-20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const total = activeGalleryProduct.imageUrls?.length || 1;
                    setActiveImageIndex((prev) => (prev + 1) % total);
                    setIsZoomed(false);
                  }}
                  className="absolute right-4 h-12 w-12 rounded-full border border-white/10 bg-black/50 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg z-20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {((activeGalleryProduct.imageUrls && activeGalleryProduct.imageUrls.length > 1) || false) && (
            <div className="flex gap-2 max-w-full overflow-x-auto py-2 z-10 border-t border-white/10 w-full justify-center scrollbar-none">
              {activeGalleryProduct.imageUrls?.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => { setActiveImageIndex(idx); setIsZoomed(false); }}
                  className={cn(
                    "h-12 w-12 rounded-lg border overflow-hidden flex items-center justify-center shrink-0 cursor-pointer transition-all bg-black",
                    activeImageIndex === idx ? "border-white ring-2 ring-white/50" : "border-white/15 hover:border-white/50"
                  )}
                >
                  <img src={url} className="object-contain max-h-full max-w-full" alt="thumbnail" />
                </button>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Request Pokémon Form Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#09090B] p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-white">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsRequestModalOpen(false);
                setRequestSuccess(false);
                setRequestError(null);
              }}
              className="absolute top-4 right-4 h-7 w-7 rounded-md border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <h3 className="font-semibold text-sm tracking-tight">Request a Pokémon</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Can't find the Pokémon you need? Tell us what you're looking for, and we'll source it for you.</p>
            </div>

            {requestSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="h-10 w-10 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-500 font-bold">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold">Request Submitted!</h4>
                  <p className="text-[10.5px] text-zinc-500 dark:text-zinc-450 max-w-xs mx-auto leading-relaxed">
                    We have successfully logged your Pokémon request. Our sourcing team will contact you shortly via the social link provided.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsRequestModalOpen(false);
                    setRequestSuccess(false);
                  }}
                  className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setRequesting(true);
                  setRequestError(null);
                  
                  const target = e.target as HTMLFormElement;
                  const pokemonName = (target.elements.namedItem("pokemonName") as HTMLInputElement).value;
                  const socialPlatform = (target.elements.namedItem("socialPlatform") as HTMLSelectElement).value;
                  const socialId = (target.elements.namedItem("socialId") as HTMLInputElement).value;
                  const description = (target.elements.namedItem("description") as HTMLTextAreaElement).value;

                  const res = await createPokemonRequestAction({
                    pokemonName,
                    socialPlatform,
                    socialId,
                    description,
                  });

                  if (res.success) {
                    setRequestSuccess(true);
                  } else {
                    setRequestError(res.error || "Failed to submit request.");
                  }
                  setRequesting(false);
                }}
                className="space-y-3.5 text-xs"
              >
                {requestError && (
                  <div className="flex items-center gap-2 rounded-md bg-red-500/5 border border-red-500/10 p-3 text-xs text-red-555 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {requestError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Pokémon Name *</label>
                  <input
                    type="text"
                    name="pokemonName"
                    required
                    placeholder="e.g. Shiny Rayquaza, Shadow Mewtwo, etc."
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-655 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Social Platform *</label>
                    <select
                      name="socialPlatform"
                      required
                      defaultValue="Telegram"
                      className="w-full h-8 px-2 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors cursor-pointer"
                    >
                      <option value="Telegram" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Telegram</option>
                      <option value="Discord" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Discord</option>
                      <option value="Facebook" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Facebook</option>
                      <option value="Instagram" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Instagram</option>
                      <option value="Reddit" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Reddit</option>
                      <option value="WhatsApp" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">WhatsApp</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Social Username/ID *</label>
                    <input
                      type="text"
                      name="socialId"
                      required
                      placeholder="e.g. @username or tag"
                      className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-655 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Description (IVs, Level, CP details) *</label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    placeholder="Provide details about the specific Pokémon you want (CP range, shiny preference, specific fast/charged moves, gender, etc.)"
                    className="w-full min-h-[80px] p-2.5 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors leading-normal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={requesting}
                  className="w-full h-8 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition-all active:scale-[0.98] mt-4 cursor-pointer"
                >
                  {requesting ? "Submitting request..." : "Submit Sourcing Request"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Request Custom Service Form Modal (Account, Stardust, XP) */}
      {isCustomRequestModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#09090B] p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-white">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsCustomRequestModalOpen(false);
                setCustomRequestSuccess(false);
                setCustomRequestError(null);
              }}
              className="absolute top-4 right-4 h-7 w-7 rounded-md border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <h3 className="font-semibold text-sm tracking-tight">
                {customRequestType === "ACCOUNT" ? "Request a Custom Account" :
                 customRequestType === "STARDUST" ? "Request Custom Stardust" :
                 customRequestType === "RAIDSERVICE" ? "Request Custom Raid Service" :
                 "Request Custom XP / Leveling"}
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                {customRequestType === "ACCOUNT" ? "Can't find the account you need? Tell us your target level, shiny count, and rare assets, and we will source it for you." :
                 customRequestType === "STARDUST" ? "Need a specific amount of Stardust? Let us know your targets and we will calculate a secure sourcing timeline." :
                 customRequestType === "RAIDSERVICE" ? "Looking for custom raid lobbies, coordinates, or boss clears? Let us know which raids you want us to run." :
                 "Looking for custom leveling or XP boosts? Provide your details and we will coordinate the training process."}
              </p>
            </div>

            {customRequestSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="h-10 w-10 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-500 font-bold">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold">Request Submitted!</h4>
                  <p className="text-[10.5px] text-zinc-500 dark:text-zinc-450 max-w-xs mx-auto leading-relaxed">
                    We have successfully logged your custom request. Our trading team will contact you shortly via the social handle provided.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCustomRequestModalOpen(false);
                    setCustomRequestSuccess(false);
                  }}
                  className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCustomRequesting(true);
                  setCustomRequestError(null);
                  
                  const target = e.target as HTMLFormElement;
                  const title = (target.elements.namedItem("title") as HTMLInputElement).value;
                  const socialPlatform = (target.elements.namedItem("socialPlatform") as HTMLSelectElement).value;
                  const socialId = (target.elements.namedItem("socialId") as HTMLInputElement).value;
                  const description = (target.elements.namedItem("description") as HTMLTextAreaElement).value;

                  const res = await createCustomRequestAction({
                    requestType: customRequestType,
                    title,
                    socialPlatform,
                    socialId,
                    description,
                  });

                  if (res.success) {
                    setCustomRequestSuccess(true);
                  } else {
                    setCustomRequestError(res.error || "Failed to submit request.");
                  }
                  setCustomRequesting(false);
                }}
                className="space-y-3.5 text-xs"
              >
                {customRequestError && (
                  <div className="flex items-center gap-2 rounded-md bg-red-500/5 border border-red-500/10 p-3 text-xs text-red-555 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {customRequestError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">
                    {customRequestType === "ACCOUNT" ? "Target Account Level / Rare Pokemons *" :
                     customRequestType === "STARDUST" ? "Requested Stardust Amount (e.g. 5 Million) *" :
                     "Target XP Level / Amount *"}
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder={
                      customRequestType === "ACCOUNT" ? "e.g. Level 50, Shiny Mew, 400+ Shinies" :
                      customRequestType === "STARDUST" ? "e.g. 10 Million Stardust Boost" :
                      "e.g. Level 40 to 50, 20M XP Boost"
                    }
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Social Platform *</label>
                    <select
                      name="socialPlatform"
                      required
                      defaultValue="Telegram"
                      className="w-full h-8 px-2 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors cursor-pointer"
                    >
                      <option value="Telegram" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Telegram</option>
                      <option value="Discord" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Discord</option>
                      <option value="Facebook" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Facebook</option>
                      <option value="Instagram" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Instagram</option>
                      <option value="Reddit" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Reddit</option>
                      <option value="WhatsApp" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">WhatsApp</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Social Username/ID *</label>
                    <input
                      type="text"
                      name="socialId"
                      required
                      placeholder="e.g. @username or tag"
                      className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-655 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Detailed Requirements *</label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    placeholder={
                      customRequestType === "ACCOUNT" ? "Provide specifications (e.g. specific shiny legendaries, level, team color preference, region/location background, lucky trades, etc.)" :
                      customRequestType === "STARDUST" ? "Provide details (e.g. current stardust amount, target timeline, preference for trade-only stardust, etc.)" :
                      "Provide details (e.g. current level, target level, specific training methods preferred, timeline requirements, etc.)"
                    }
                    className="w-full min-h-[80px] p-2.5 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors leading-normal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={customRequesting}
                  className="w-full h-8 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition-all active:scale-[0.98] mt-4 cursor-pointer"
                >
                  {customRequesting ? "Submitting request..." : "Submit Sourcing Request"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

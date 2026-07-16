"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreditCard, X, Sparkles, MessageSquare, ScanQrCode, Coins, DollarSign, Globe, CircleDot } from "lucide-react";
import { useSession } from "next-auth/react";
import { createRegistrationOrder } from "@/features/payments/actions";
import { UpiPaymentCheckout } from "./upi-checkout";
import { PayPalPaymentCheckout } from "./paypal-checkout";
import { CryptoPaymentCheckout } from "./crypto-checkout";
import { WisePaymentCheckout } from "./wise-checkout";
import { useCurrencyStore, Currency } from "@/store/useCurrencyStore";
import { getDb } from "@/lib/firestore";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { AnimatedCardIcon, AnimatedCryptoIcon, PaypalIcon, WiseIcon } from "@/components/ui/animated-payment-icons";

interface RegisterAuctionButtonProps {
  auctionId: string;
  onSuccess?: () => void;
  label?: string;
  className?: string;
}

export function RegisterAuctionButton({ auctionId, onSuccess, label, className }: RegisterAuctionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [upiCheckoutData, setUpiCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [paypalCheckoutData, setPaypalCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [cryptoCheckoutData, setCryptoCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [wiseCheckoutData, setWiseCheckoutData] = useState<{ orderId: string; amount: number; currency: Currency; email: string } | null>(null);
  const [paymentStage, setPaymentStage] = useState<"methods" | "platforms" | "upi" | "paypal" | "crypto" | "wise">("methods");
  const [selectedMethod, setSelectedMethod] = useState<"UPI" | "Card" | "Crypto" | "PayPal" | "Wise" | "Others" | null>(null);
  const { data: session, status } = useSession();

  const handleButtonClick = () => {
    if (status === "loading") return;
    if (!session?.user) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    } else {
      setIsOpen(true);
    }
  };

  const handleManualOrderChat = async (method: "Card" | "Others") => {
    if (status === "loading" || !session?.user) return;
    const userId = (session.user as any).id as string;
    const username = (session.user as any).username || session.user.name || session.user.email || "User";

    try {
      const res = await createRegistrationOrder(auctionId);
      if (res.success && res.orderContext?.id) {
        const orderId = res.orderContext.id;
        const db = getDb();
        const chatId = `order-${orderId}`;
        const chatRef = doc(db, "supportChats", chatId);

        const methodLabel = method === "Card" ? "Card, Cash App, Apple Pay" : "Others";
        
        const messageText = `📦 NEW ORDER: Bidding Registration Deposit
----------------------------------
Order ID: ${orderId}
Amount: $2.50 USD
Payment Method: ${methodLabel}

👤 USER DETAILS:
----------------------------------
Username: ${username}
Email: ${session?.user?.email || "N/A"}
User ID: ${userId}

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

        // Close modal and redirect
        setIsOpen(false);
        window.location.href = `/chat?chatId=${chatId}`;
      } else {
        alert("Error creating order: " + (res.error || "Please try again."));
      }
    } catch (err) {
      console.error("Manual order chat error:", err);
      alert("Failed to initiate chat. Please try again.");
    }
  };

  return (
    <>
      <Button
        onClick={handleButtonClick}
        disabled={status === "loading"}
        className={className || "w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-all active:scale-[0.98] border border-zinc-700/50 cursor-pointer"}
      >
        <CreditCard className="h-4 w-4 text-white" />
      </Button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setUpiCheckoutData(null);
              setPaypalCheckoutData(null);
              setCryptoCheckoutData(null);
              setWiseCheckoutData(null);
              setPaymentStage("methods");
              setSelectedMethod(null);
              setIsOpen(false);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            className={cn(
              "relative w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/95 p-6 shadow-2xl space-y-6 text-zinc-900 dark:text-white transition-all duration-300 cursor-default overflow-y-auto max-h-[95vh] scrollbar-thin",
              (paymentStage === "upi" || paymentStage === "paypal" || paymentStage === "crypto" || paymentStage === "wise") ? "max-w-4xl" : "max-w-3xl"
            )}
          >
            
            {/* Close Button */}
            <button
              onClick={() => {
                setUpiCheckoutData(null);
                setPaypalCheckoutData(null);
                setCryptoCheckoutData(null);
                setWiseCheckoutData(null);
                setPaymentStage("methods");
                setSelectedMethod(null);
                setIsOpen(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none"
            >
              <X className="h-5 w-5" />
            </button>

            {/* STAGE 1: WISE CHECKOUT GATEWAY */}
            {paymentStage === "wise" && wiseCheckoutData ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-850">
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
                />
              </div>
            ) : paymentStage === "crypto" && cryptoCheckoutData ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-850">
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
                />
              </div>
            ) : paymentStage === "paypal" && paypalCheckoutData ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-850">
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
                />
              </div>
            ) : paymentStage === "upi" && upiCheckoutData ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-850">
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
                />
              </div>
            ) : (
              /* STAGE 3: CHOOSE PAYMENT METHOD (6 OPTIONS) */
              <>
                {/* Header */}
                <div className="space-y-1.5">
                  <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#6133e1]" />
                    One-Time Bidding Verification
                  </h2>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400">
                    Pay a one-time verification deposit to bid across all live auctions. This money is completely refundable and will be deducted from the total amount of any future purchase you make from our store, whether for services or products.
                  </p>
                  <div className="text-2xl font-black text-[#6133e1] pt-1">
                    $2.50
                  </div>
                </div>

                {/* 6 Payment Methods Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">

                  {/* 1. UPI */}
                  <button
                    onClick={async () => {
                      try {
                        const res = await createRegistrationOrder(auctionId);
                        if (res.success && res.orderContext?.id) {
                          const depositPrice = 2.50; // USD
                          const inrRate = useCurrencyStore.getState().rates.INR || 83.5;
                          const amountInINR = Math.round(depositPrice * inrRate);

                          setUpiCheckoutData({
                            orderId: res.orderContext.id,
                            amount: amountInINR,
                            email: session?.user?.email || "customer@deposit.com",
                          });
                          setSelectedMethod("UPI");
                          setPaymentStage("upi");
                        } else {
                          alert("Error creating registration: " + (res.error || "Please try again."));
                        }
                      } catch (err) {
                        console.error("UPI registration error:", err);
                        alert("Failed to initiate UPI transaction. Please try again.");
                      }
                    }}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-[#6133e1] dark:hover:border-[#6133e1]/50 hover:bg-white dark:hover:bg-white/[0.02] transition cursor-pointer text-left w-full group active:scale-[0.98] shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#6133e1]/10 text-[#6133e1] dark:bg-[#6133e1]/20">
                        <ScanQrCode className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">UPI Transfer</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Zero fee instant payments</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-[#6133e1]/10 text-[#6133e1] dark:text-violet-400 px-2 py-0.5 rounded-full font-bold uppercase border border-[#6133e1]/10">Instant</span>
                    </div>
                  </button>

                  {/* 2. Credit Card */}
                  <button
                    onClick={() => handleManualOrderChat("Card")}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-blue-500 dark:hover:border-blue-500/50 hover:bg-white dark:hover:bg-white/[0.02] transition cursor-pointer text-left w-full group active:scale-[0.98] shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                        <AnimatedCardIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Card, Cash App, Apple Pay</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Global card processing</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase border border-blue-500/10">Manual</span>
                    </div>
                  </button>

                  {/* 3. Crypto */}
                  <button
                    onClick={async () => {
                      try {
                        const res = await createRegistrationOrder(auctionId);
                        if (res.success && res.orderContext?.id) {
                          const depositPrice = 2.50; // USD
                          setCryptoCheckoutData({
                            orderId: res.orderContext.id,
                            amount: depositPrice,
                            email: session?.user?.email || "customer@deposit.com",
                          });
                          setSelectedMethod("Crypto");
                          setPaymentStage("crypto");
                        } else {
                          alert("Error creating registration: " + (res.error || "Please try again."));
                        }
                      } catch (err) {
                        console.error("Crypto registration error:", err);
                        alert("Failed to initiate Crypto transaction. Please try again.");
                      }
                    }}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-amber-500 dark:hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/[0.02] transition cursor-pointer text-left w-full group active:scale-[0.98] shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                        <AnimatedCryptoIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Crypto</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Secure USDT, BTC, ETH</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-500/10">Instant</span>
                    </div>
                  </button>

                  {/* 4. PayPal */}
                  <button
                    onClick={async () => {
                      try {
                        const res = await createRegistrationOrder(auctionId);
                        if (res.success && res.orderContext?.id) {
                          const depositPriceUSD = 2.50; // USD
                          const eurRate = useCurrencyStore.getState().rates.EUR || 0.92;
                          const amountInEUR = Math.round(depositPriceUSD * eurRate * 100) / 100;
                          
                          setPaypalCheckoutData({
                            orderId: res.orderContext.id,
                            amount: amountInEUR,
                            email: session?.user?.email || "customer@deposit.com",
                          });
                          setSelectedMethod("PayPal");
                          setPaymentStage("paypal");
                        } else {
                          alert("Error creating registration: " + (res.error || "Please try again."));
                        }
                      } catch (err) {
                        console.error("PayPal registration error:", err);
                        alert("Failed to initiate PayPal transaction. Please try again.");
                      }
                    }}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-sky-500 dark:hover:border-sky-500/50 hover:bg-white dark:hover:bg-white/[0.02] transition cursor-pointer text-left w-full group active:scale-[0.98] shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                        <PaypalIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">PayPal</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Global instant verification</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-sky-500/10 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-full font-bold uppercase border border-sky-500/10">Instant</span>
                    </div>
                  </button>

                  {/* 5. Wise */}
                  <button
                    disabled={true}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 opacity-55 cursor-not-allowed text-left w-full group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 shrink-0 text-zinc-900 dark:text-white">
                        <WiseIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Wise</span>
                        <span className="text-[10px] text-red-500 font-semibold">Min $5.00 required</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded-full font-bold uppercase border border-zinc-500/20">Disabled</span>
                    </div>
                  </button>

                  {/* 6. Others */}
                  <button
                    onClick={() => handleManualOrderChat("Others")}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-zinc-400 dark:hover:border-zinc-400/50 hover:bg-white dark:hover:bg-white/[0.02] transition cursor-pointer text-left w-full group active:scale-[0.98] shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500 dark:bg-zinc-500/20">
                        <CircleDot className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-zinc-900 dark:text-white block tracking-tight">Others</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Payoneer, Alipay, Custom chat</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 px-2 py-0.5 rounded-full font-bold uppercase">Manual</span>
                    </div>
                  </button>

                </div>

                {/* Footer */}
                <div className="pt-2 flex items-center justify-center text-[10px] text-zinc-450 dark:text-zinc-500">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>🔒 Secured &amp; encrypted manual payment system</span>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

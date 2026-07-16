"use client";

import { useState } from "react";
import { Send, X, MessageSquare, ScanQrCode, CreditCard, Coins, DollarSign, Globe, CircleDot, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { getDb } from "@/lib/firestore";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { PriceDisplay } from "@/components/price-display";
import { UpiPaymentCheckout } from "@/features/payments/components/upi-checkout";
import { PayPalPaymentCheckout } from "@/features/payments/components/paypal-checkout";
import { CryptoPaymentCheckout } from "@/features/payments/components/crypto-checkout";
import { WisePaymentCheckout } from "@/features/payments/components/wise-checkout";
import { AnimatedCardIcon, AnimatedCryptoIcon, PaypalIcon, WiseIcon } from "@/components/ui/animated-payment-icons";
import { cn } from "@/lib/utils";

interface ResendMessageButtonProps {
  orderId: string;
  orderType: string;
  items: string[];
  price: number;
}

type PaymentMethod = "UPI" | "Card" | "Crypto" | "PayPal" | "Wise" | "Others";

export function ResendMessageButton({ orderId, orderType, items, price }: ResendMessageButtonProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const { rates, currency, convert } = useCurrencyStore();
  const inrRate = rates.INR || 83.5;
  const amountInINR = Math.round(price * inrRate);

  const eurRate = rates.EUR || 0.92;
  const amountInEUR = Math.round(price * eurRate * 100) / 100;

  const selectedCurrency = currency;
  const rate = rates[selectedCurrency] || 1.0;
  const amountInSelected = Math.round(price * rate * 100) / 100;

  const handleManualOrderChat = async (method: "Card" | "Others") => {
    if (!session?.user) {
      alert("Please log in first.");
      return;
    }
    setIsSubmittingManual(true);
    const userId = (session.user as any).id as string;
    const username = (session.user as any).username || session.user.name || session.user.email || "User";
    const email = session.user.email || "customer@store.com";

    try {
      const db = getDb();
      const chatId = `order-${orderId}`;
      const chatRef = doc(db, "supportChats", chatId);

      const methodLabel = method === "Card" ? "Card, Cash App, Apple Pay" : "Others";
      const itemsList = items.map(item => `- ${item}`).join("\n");

      const messageText = `📦 ORDER FOLLOW UP: Manual Payment
----------------------------------
Order ID: ${orderId}
Items:
${itemsList}
Total Price: $${price.toFixed(2)} USD
Payment Method: ${methodLabel}

👤 USER DETAILS:
----------------------------------
Username: ${username}
Email: ${email}
User ID: ${userId}

Please guide me on how to complete the payment!`;

      await setDoc(chatRef, {
        userId,
        username,
        email,
        type: "order",
        orderId,
        title: `Order #${orderId.substring(0, 8).toUpperCase()}`,
        lastMessage: `Payment coordination started for ${methodLabel}.`,
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: 1,
        unreadByUser: 0,
        createdAt: serverTimestamp(),
      }, { merge: true });

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

      setIsOpen(false);
      window.location.href = `/chat?chatId=${chatId}`;
    } catch (err) {
      console.error("Manual order chat error:", err);
      alert("Failed to initiate chat. Please try again.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const email = session?.user?.email || "customer@store.com";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => {
          setSelectedMethod(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-500 dark:text-zinc-400 hover:border-violet-300 dark:hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-all cursor-pointer font-semibold"
      >
        <Send className="h-3 w-3" />
        Pay / Resend
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] shadow-2xl p-5 md:p-6 space-y-4 my-8">

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none"
            >
              <X className="h-5 w-5" />
            </button>

            {/* STAGE 1: Pay Gate View if method is selected */}
            {selectedMethod === "UPI" ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <ScanQrCode className="h-4.5 w-4.5 text-[#6133e1]" />
                    UPI Pay Gate
                  </h3>
                  <button
                    onClick={() => setSelectedMethod(null)}
                    className="text-[10px] font-bold text-[#6133e1] dark:text-purple-400 cursor-pointer bg-transparent border-none hover:underline"
                  >
                    Back to options
                  </button>
                </div>
                <UpiPaymentCheckout
                  orderId={orderId}
                  amount={amountInINR}
                  customerEmail={email}
                />
              </div>
            ) : selectedMethod === "PayPal" ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <PaypalIcon className="h-4.5 w-4.5 text-blue-500" />
                    PayPal Secure Gate
                  </h3>
                  <button
                    onClick={() => setSelectedMethod(null)}
                    className="text-[10px] font-bold text-[#6133e1] dark:text-purple-400 cursor-pointer bg-transparent border-none hover:underline"
                  >
                    Back to options
                  </button>
                </div>
                <PayPalPaymentCheckout
                  orderId={orderId}
                  amount={amountInEUR}
                  customerEmail={email}
                />
              </div>
            ) : selectedMethod === "Crypto" ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Coins className="h-4.5 w-4.5 text-amber-500" />
                    Crypto Secure Gate
                  </h3>
                  <button
                    onClick={() => setSelectedMethod(null)}
                    className="text-[10px] font-bold text-[#6133e1] dark:text-purple-400 cursor-pointer bg-transparent border-none hover:underline"
                  >
                    Back to options
                  </button>
                </div>
                <CryptoPaymentCheckout
                  orderId={orderId}
                  amount={price}
                  customerEmail={email}
                />
              </div>
            ) : selectedMethod === "Wise" ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="h-4.5 w-4.5 text-emerald-500" />
                    Wise Secure Gate
                  </h3>
                  <button
                    onClick={() => setSelectedMethod(null)}
                    className="text-[10px] font-bold text-[#6133e1] dark:text-purple-400 cursor-pointer bg-transparent border-none hover:underline"
                  >
                    Back to options
                  </button>
                </div>
                <WisePaymentCheckout
                  orderId={orderId}
                  amount={amountInSelected}
                  currency={selectedCurrency}
                  customerEmail={email}
                />
              </div>
            ) : (
              /* STAGE 2: Choose Payment Method List */
              <>
                {/* Header */}
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-violet-500" />
                    Complete Order Payment
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Select a payment option below to submit proof or initiate payment coordination.
                  </p>
                </div>

                {/* Order total info */}
                <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Order ID: {orderId}</p>
                    <p className="text-xs font-semibold text-zinc-850 dark:text-zinc-200 truncate mt-0.5">{items.join(", ")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-550 leading-none mb-0.5">Amount Due</p>
                    <p className="text-sm font-bold text-[#6133e1] dark:text-violet-400">
                      <PriceDisplay amountInUSD={price} />
                    </p>
                  </div>
                </div>

                {/* Payment Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {/* 1. UPI */}
                  <button
                    onClick={() => setSelectedMethod("UPI")}
                    disabled={isSubmittingManual}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-[#6133e1] dark:hover:border-[#6133e1]/50 hover:bg-white dark:hover:bg-white/[0.02] transition cursor-pointer text-left w-full group active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-[#6133e1]/10 text-[#6133e1]">
                        <ScanQrCode className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-zinc-900 dark:text-white block">UPI Transfer</span>
                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium">Zero fee instant</span>
                      </div>
                    </div>
                  </button>

                  {/* 2. Card */}
                  <button
                    onClick={() => handleManualOrderChat("Card")}
                    disabled={isSubmittingManual}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-blue-500 dark:hover:border-blue-500/50 hover:bg-white dark:hover:bg-white/[0.02] transition cursor-pointer text-left w-full group active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-7 h-7 text-zinc-900 dark:text-white">
                        <AnimatedCardIcon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-zinc-900 dark:text-white block">Card / Cash App</span>
                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium">Apple Pay, DMs</span>
                      </div>
                    </div>
                  </button>

                  {/* 3. Crypto */}
                  <button
                    onClick={() => setSelectedMethod("Crypto")}
                    disabled={isSubmittingManual}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-amber-500 dark:hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/[0.02] transition cursor-pointer text-left w-full group active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-7 h-7 text-zinc-900 dark:text-white">
                        <AnimatedCryptoIcon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-zinc-900 dark:text-white block">Crypto</span>
                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium">USDT, BTC, ETH</span>
                      </div>
                    </div>
                  </button>

                  {/* 4. PayPal */}
                  <button
                    onClick={() => setSelectedMethod("PayPal")}
                    disabled={isSubmittingManual}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-sky-500 dark:hover:border-sky-500/50 hover:bg-white dark:hover:bg-white/[0.02] transition cursor-pointer text-left w-full group active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-7 h-7 text-zinc-900 dark:text-white">
                        <PaypalIcon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-zinc-900 dark:text-white block">PayPal</span>
                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium">Global instant gate</span>
                      </div>
                    </div>
                  </button>

                  {/* 5. Wise */}
                  {(() => {
                    const isWiseDisabled = price < 5.00;

                    return (
                      <button
                        onClick={() => {
                          if (isWiseDisabled) return;
                          setSelectedMethod("Wise");
                        }}
                        disabled={isSubmittingManual || isWiseDisabled}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 transition text-left w-full group shadow-xs",
                          isWiseDisabled
                            ? "opacity-55 cursor-not-allowed"
                            : "hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:bg-white dark:hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center w-7 h-7 text-zinc-900 dark:text-white">
                            <WiseIcon className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-zinc-900 dark:text-white block">Wise Transfer</span>
                            <span className={cn("text-[9px] font-medium block", isWiseDisabled ? "text-red-500" : "text-zinc-500 dark:text-zinc-400")}>
                              {isWiseDisabled ? "Min $5.00 required" : "Wise-to-Wise link"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })()}

                  {/* 6. Others */}
                  <button
                    onClick={() => handleManualOrderChat("Others")}
                    disabled={isSubmittingManual}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-500 dark:hover:border-zinc-500/50 hover:bg-white dark:hover:bg-white/[0.02] transition cursor-pointer text-left w-full group active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-zinc-500/10 text-zinc-500">
                        <CircleDot className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-zinc-900 dark:text-white block">Others</span>
                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium">Alipay, Payoneer</span>
                      </div>
                    </div>
                  </button>
                </div>

                {isSubmittingManual && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#6133e1]" />
                    <span className="text-xs text-zinc-500">Setting up coordination chat...</span>
                  </div>
                )}

                {/* Footer note */}
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
                  🔒 Encrypted and secured verification system.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

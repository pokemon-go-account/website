"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreditCard, X, Sparkles, MessageSquare, ScanQrCode, Coins, DollarSign, Globe, CircleDot } from "lucide-react";
import { useSession } from "next-auth/react";
import { createRegistrationOrder } from "@/features/payments/actions";
import { UpiPaymentCheckout } from "./upi-checkout";
import { useCurrencyStore } from "@/store/useCurrencyStore";

interface RegisterAuctionButtonProps {
  auctionId: string;
  onSuccess?: () => void;
  label?: string;
  className?: string;
}

export function RegisterAuctionButton({ auctionId, onSuccess, label, className }: RegisterAuctionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [upiCheckoutData, setUpiCheckoutData] = useState<{ orderId: string; amount: number; email: string } | null>(null);
  const [paymentStage, setPaymentStage] = useState<"methods" | "platforms" | "upi">("methods");
  const [selectedMethod, setSelectedMethod] = useState<"UPI" | "Card" | "Crypto" | "PayPal" | "Wise" | "Others" | null>(null);
  const { data: session } = useSession();

  const handleButtonClick = () => {
    if (!session?.user) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    } else {
      setIsOpen(true);
    }
  };

  const handleSocialRedirect = async (platform: "telegram" | "reddit" | "instagram" | "facebook") => {
    let orderIdStr = "";
    try {
      const res = await createRegistrationOrder(auctionId);
      if (res.success && res.orderContext?.id) {
        orderIdStr = `Order ID: ${res.orderContext.id}\n`;
      }
    } catch (err) {
      console.error("Failed to persist registration order:", err);
    }

    const methodLabel = selectedMethod === "Card" ? "Credit/Debit Card (Visa/Mastercard/Amex)" :
                        selectedMethod === "Crypto" ? "Cryptocurrency" :
                        selectedMethod === "PayPal" ? "PayPal" :
                        selectedMethod === "Wise" ? "Wise" : "Others";

    const message = `Hi Pokémon GO Services! I would like to pay the one-time $2.50 verification deposit to verify my account for bidding across all auctions and pay via ${methodLabel}.
${orderIdStr}Please let me know how to proceed with the payment!`;

    try {
      await navigator.clipboard.writeText(message);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }

    if (platform === "telegram") {
      window.open(`https://telegram.me/pokemongoservicesadmin?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    } else if (platform === "reddit") {
      window.open(`https://www.reddit.com/message/compose/?to=PokemonGo-Services&subject=Deposit%20Verification&message=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    } else if (platform === "instagram") {
      alert("📋 We have copied your deposit details to your clipboard! Paste it in the Instagram DM to proceed.");
      window.open("https://www.instagram.com/pokemongoservicesadmin/", "_blank", "noopener,noreferrer");
    } else if (platform === "facebook") {
      alert("📋 We have copied your deposit details to your clipboard! Paste it in the Facebook message to proceed.");
      window.open("https://www.facebook.com/share/1LdWHj4HQz/?mibextid=wwXIfr", "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <Button
        onClick={handleButtonClick}
        className={className || "w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-all active:scale-[0.98] border border-zinc-700/50 cursor-pointer"}
      >
        <CreditCard className="h-4 w-4 text-white" />
      </Button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setUpiCheckoutData(null);
              setPaymentStage("methods");
              setSelectedMethod(null);
              setIsOpen(false);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            className={cn(
              "relative w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/95 p-6 shadow-2xl space-y-6 text-zinc-900 dark:text-white transition-all duration-300 cursor-default",
              paymentStage === "upi" ? "max-w-2xl" : "max-w-md"
            )}
          >
            
            {/* Close Button */}
            <button
              onClick={() => {
                setUpiCheckoutData(null);
                setPaymentStage("methods");
                setSelectedMethod(null);
                setIsOpen(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none"
            >
              <X className="h-5 w-5" />
            </button>

            {/* STAGE 1: UPI CHECKOUT GATEWAY */}
            {paymentStage === "upi" && upiCheckoutData ? (
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
            ) : paymentStage === "platforms" && selectedMethod ? (
              /* STAGE 2: SOCIAL REDIRECT PLATFORMS FOR MANUAL VERIFICATION */
              <div className="space-y-5 text-left">
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#6133e1]" />
                    Manual Order Verification
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Verify and complete your deposit via <strong>{selectedMethod}</strong> using one of our verified chat agents below:
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option 1: Pay via Telegram */}
                  <button
                    onClick={() => handleSocialRedirect("telegram")}
                    className="w-full text-left overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 p-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Pay via Telegram</h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Direct message @pokemongoservicesadmin for validation</p>
                      </div>
                      <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                        Active
                      </span>
                    </div>
                  </button>

                  {/* Option 2: Pay via Reddit */}
                  <button
                    onClick={() => handleSocialRedirect("reddit")}
                    className="w-full text-left overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 p-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Pay via Reddit</h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">DM user /u/PokemonGo-Services to process payment</p>
                      </div>
                      <span className="bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold border border-orange-500/20">
                        Active
                      </span>
                    </div>
                  </button>

                  {/* Option 3: Pay via Instagram */}
                  <button
                    onClick={() => handleSocialRedirect("instagram")}
                    className="w-full text-left overflow-hidden rounded-xl border border-zinc-200/85 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 p-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Pay via Instagram</h3>
                        <p className="text-[11px] text-zinc-555 dark:text-zinc-400">DM @pokemongoservicesadmin on Instagram</p>
                      </div>
                      <span className="bg-pink-500/10 text-pink-600 px-2 py-0.5 rounded text-[10px] font-bold border border-pink-500/20">
                        Active
                      </span>
                    </div>
                  </button>

                  {/* Option 4: Pay via Facebook */}
                  <button
                    onClick={() => handleSocialRedirect("facebook")}
                    className="w-full text-left overflow-hidden rounded-xl border border-zinc-200/85 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 p-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Pay via Facebook</h3>
                        <p className="text-[11px] text-zinc-555 dark:text-zinc-400">Message us on Facebook to complete deposit verification</p>
                      </div>
                      <span className="bg-blue-600/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                        Active
                      </span>
                    </div>
                  </button>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setPaymentStage("methods")}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer bg-transparent border-none"
                  >
                    &larr; Back to Payment Methods
                  </button>
                </div>
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
                <div className="grid grid-cols-2 gap-3 pt-1">

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
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-zinc-300 dark:hover:border-violet-500/30 hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition cursor-pointer text-center space-y-2 group active:scale-[0.98]"
                  >
                    <ScanQrCode className="h-5 w-5 text-violet-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">UPI QR / App</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Instant transfer</p>
                    </div>
                  </button>

                  {/* 2. Credit Card */}
                  <button
                    onClick={() => {
                      setSelectedMethod("Card");
                      setPaymentStage("platforms");
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-zinc-300 dark:hover:border-violet-500/30 hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition cursor-pointer text-center space-y-2 group active:scale-[0.98]"
                  >
                    <CreditCard className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Credit Card</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Visa, Mastercard, Amex</p>
                    </div>
                  </button>

                  {/* 3. Crypto */}
                  <button
                    onClick={() => {
                      setSelectedMethod("Crypto");
                      setPaymentStage("platforms");
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-zinc-300 dark:hover:border-violet-500/30 hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition cursor-pointer text-center space-y-2 group active:scale-[0.98]"
                  >
                    <Coins className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Cryptocurrency</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">USDT, BTC, ETH</p>
                    </div>
                  </button>

                  {/* 4. PayPal */}
                  <button
                    onClick={() => {
                      setSelectedMethod("PayPal");
                      setPaymentStage("platforms");
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-zinc-300 dark:hover:border-violet-500/30 hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition cursor-pointer text-center space-y-2 group active:scale-[0.98]"
                  >
                    <DollarSign className="h-5 w-5 text-sky-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">PayPal</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Instant checkout</p>
                    </div>
                  </button>

                  {/* 5. Wise */}
                  <button
                    onClick={() => {
                      setSelectedMethod("Wise");
                      setPaymentStage("platforms");
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-zinc-300 dark:hover:border-violet-500/30 hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition cursor-pointer text-center space-y-2 group active:scale-[0.98]"
                  >
                    <Globe className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Wise Transfer</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Global bank pay</p>
                    </div>
                  </button>

                  {/* 6. Others */}
                  <button
                    onClick={() => {
                      setSelectedMethod("Others");
                      setPaymentStage("platforms");
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 hover:border-zinc-300 dark:hover:border-violet-500/30 hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition cursor-pointer text-center space-y-2 group active:scale-[0.98]"
                  >
                    <CircleDot className="h-5 w-5 text-zinc-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Other Methods</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Custom billing chat</p>
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

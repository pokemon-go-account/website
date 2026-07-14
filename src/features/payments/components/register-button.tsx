"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { CreditCard, X, Sparkles, MessageSquare } from "lucide-react";
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

    const message = `Hi Pokémon GO Services! I would like to pay the one-time $2.50 verification deposit to verify my account for bidding across all auctions.
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
        {label || "Pay One-Time Verification Deposit ($2.50)"}
      </Button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d12]/95 p-6 shadow-2xl space-y-6 text-zinc-900 dark:text-white">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setUpiCheckoutData(null);
                setIsOpen(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none"
            >
              <X className="h-5 w-5" />
            </button>

            {upiCheckoutData ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-850">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-[#6133e1]" />
                    UPI Pay Gate
                  </h3>
                  <button
                    onClick={() => {
                      setUpiCheckoutData(null);
                    }}
                    className="text-[10px] font-bold text-zinc-500 hover:text-[#6133e1] dark:hover:text-purple-400 cursor-pointer bg-transparent border-none transition-colors"
                  >
                    Back to Options
                  </button>
                </div>
                <UpiPaymentCheckout
                  orderId={upiCheckoutData.orderId}
                  amount={upiCheckoutData.amount}
                  customerEmail={upiCheckoutData.email}
                />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="space-y-1.5">
                  <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#6133e1]" />
                    One-Time Bidding Verification
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pay a one-time verification deposit to bid across all live auctions. This money is completely refundable and will be deducted from the total amount of any future purchase you make from our store, whether for services or products.
                  </p>
                  <div className="text-2xl font-black text-[#6133e1] pt-1">
                    $2.50
                  </div>
                </div>

                {/* Options List */}
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

                  {/* Option 5: Pay via UPI (P2P QR) */}
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
                        } else {
                          alert("Error creating registration: " + (res.error || "Please try again."));
                        }
                      } catch (err) {
                        console.error("UPI registration error:", err);
                        alert("Failed to initiate UPI transaction. Please try again.");
                      }
                    }}
                    className="w-full text-left overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 p-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Pay via UPI (Instant QR)</h3>
                        <p className="text-[11px] text-zinc-555 dark:text-zinc-400">Scan QR code, enter 12-digit UTR and submit screenshot</p>
                      </div>
                      <span className="bg-violet-600 text-white px-2 py-0.5 rounded text-[10px] font-bold border border-violet-500/20">
                        UPI QR
                      </span>
                    </div>
                  </button>
                </div>

                {/* Footer */}
                <div className="pt-2 flex items-center gap-1.5 justify-center text-[10px] text-zinc-500">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Verify transaction manually with receipt screenshots.</span>
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

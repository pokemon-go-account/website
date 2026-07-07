"use client";

import { useState } from "react";
import { createRegistrationOrder } from "@/features/payments/actions";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Send, ShieldAlert, X, Sparkles, MessageSquareCode } from "lucide-react";

interface RegisterAuctionButtonProps {
  auctionId: string;
  onSuccess?: () => void;
  label?: string;
  className?: string;
}

export function RegisterAuctionButton({ auctionId, onSuccess, label, className }: RegisterAuctionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Trigger dev sandbox payment flow
  const handleDevSandboxPayment = async () => {
    setIsPending(true);
    const result = await createRegistrationOrder(auctionId);

    if (!result.success || !result.orderContext) {
      alert(result.error || "Failed to initiate registration order.");
      setIsPending(false);
      return;
    }

    const { orderContext } = result;

    const confirmMock = confirm(
      "[Mock Sandbox Mode] We detected placeholder Razorpay keys in .env.local.\n\nWould you like to simulate a successful payment of $2.50 to unlock bidding access for this auction?"
    );

    if (!confirmMock) {
      setIsPending(false);
      return;
    }

    const { simulateMockPayment } = await import("@/features/payments/actions");
    const simResult = await simulateMockPayment(orderContext.id);

    if (simResult.success) {
      alert("Payment captured! Bidding access is now successfully unlocked.");
      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } else {
      alert(simResult.error || "Mock payment simulation failed.");
    }
    setIsPending(false);
  };

  const handleTelegramRedirect = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={className || "w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-all active:scale-[0.98] border border-zinc-700/50 cursor-pointer"}
      >
        <CreditCard className="h-4 w-4 text-white" />
        {label || "Pay Verification Deposit ($2.50)"}
      </Button>

      {/* Premium Dark Selector Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white" />
                Select Deposit Method
              </h2>
              <p className="text-xs text-zinc-400">
                A verification deposit of $2.50 is required to participate in live bidding.
              </p>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {/* Option 1: Razorpay (Coming Soon) */}
              <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 opacity-75">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-300">Razorpay Card / UPI</h3>
                    <p className="text-[11px] text-zinc-500">Instant validation via payment gateway</p>
                  </div>
                  <span className="bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-700/50">
                    Coming Soon
                  </span>
                </div>

                {/* Developer Sandbox Trigger Link */}
                <div className="mt-3 pt-3 border-t border-zinc-800/50 flex justify-end">
                  <button
                    onClick={handleDevSandboxPayment}
                    disabled={isPending}
                    className="text-[10px] text-zinc-400 hover:text-white font-semibold underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ShieldAlert className="h-3 w-3" />
                    )}
                    Dev Testing: Simulate Payment
                  </button>
                </div>
              </div>

              {/* Option 2: Crypto */}
              <button
                onClick={() => handleTelegramRedirect("https://t.me/PGA_Crypto_Agent")}
                className="w-full text-left overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 p-4 transition-all hover:border-zinc-700 cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">Pay with Cryptocurrency</h3>
                    <p className="text-[11px] text-zinc-400">USDT / BTC / ETH transactions supported</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">
                    Live
                  </span>
                </div>
              </button>

              {/* Option 3: Direct Agent */}
              <button
                onClick={() => handleTelegramRedirect("https://t.me/PGA_Direct_Agent")}
                className="w-full text-left overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 p-4 transition-all hover:border-zinc-700 cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1">
                      Pay Direct to Agent
                    </h3>
                    <p className="text-[11px] text-zinc-400">Connect to agent manual verification</p>
                  </div>
                  <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                    Manual
                  </span>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center gap-1.5 justify-center text-[10px] text-zinc-500">
              <MessageSquareCode className="h-3.5 w-3.5" />
              <span>Verify transaction manually with receipt screenshots.</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

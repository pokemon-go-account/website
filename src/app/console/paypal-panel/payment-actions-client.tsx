"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, Eye, X } from "lucide-react";
import { verifyPaypalPayment, rejectPaypalPayment } from "@/features/console/paypal-payment-actions";

interface PaymentActionsProps {
  paymentId: string;
  screenshotUrl: string;
  transactionId: string;
}

export function PaypalPaymentActions({ paymentId, screenshotUrl, transactionId }: PaymentActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"verify" | "reject" | null>(null);
  const [done, setDone] = useState<"Verified" | "Rejected" | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);

  const handleVerify = () => {
    setAction("verify");
    startTransition(async () => {
      await verifyPaypalPayment(paymentId);
      setDone("Verified");
    });
  };

  const handleReject = () => {
    if (!confirm("Are you sure you want to reject this payment?")) return;
    setAction("reject");
    startTransition(async () => {
      await rejectPaypalPayment(paymentId);
      setDone("Rejected");
    });
  };

  if (done === "Verified") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" /> Verified
      </span>
    );
  }
  if (done === "Rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/20">
        <XCircle className="h-3 w-3" /> Rejected
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* View Screenshot */}
        <button
          onClick={() => setShowScreenshot(true)}
          className="inline-flex items-center gap-1 h-6 px-2 rounded border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer bg-transparent"
        >
          <Eye className="h-3 w-3" />
          Screenshot
        </button>

        {/* Verify */}
        <button
          onClick={handleVerify}
          disabled={isPending}
          className="inline-flex items-center gap-1 h-6 px-2 rounded border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition cursor-pointer disabled:opacity-50 bg-transparent"
        >
          {isPending && action === "verify" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3 w-3" />
          )}
          Verify
        </button>

        {/* Reject */}
        <button
          onClick={handleReject}
          disabled={isPending}
          className="inline-flex items-center gap-1 h-6 px-2 rounded border border-red-200 dark:border-red-500/30 text-[10px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50 bg-transparent"
        >
          {isPending && action === "reject" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          Reject
        </button>
      </div>

      {/* Screenshot Modal */}
      {showScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-[#111111] rounded-2xl border border-zinc-200 dark:border-white/[0.08] p-4 max-w-lg w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Payment Screenshot</p>
                <p className="text-[10px] text-zinc-400 font-mono">TXN: {transactionId}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={screenshotUrl}
                  download={`paypal-${transactionId}.png`}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                >
                  <ExternalLink className="h-3 w-3" />
                  Download
                </a>
                <button
                  onClick={() => setShowScreenshot(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer bg-transparent border-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <img
              src={screenshotUrl}
              alt="Payment proof screenshot"
              className="w-full rounded-xl object-contain max-h-[60vh] bg-zinc-50 dark:bg-zinc-900"
            />
          </div>
        </div>
      )}
    </>
  );
}

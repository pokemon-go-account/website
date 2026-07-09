"use client";

import { useTransition } from "react";
import { cancelOrderUser } from "@/features/console/actions";
import { XCircle, Loader2 } from "lucide-react";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    startTransition(async () => {
      const res = await cancelOrderUser(orderId);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error || "Failed to cancel order.");
      }
    });
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-550/20 dark:border-red-500/20 bg-red-550/10 dark:bg-red-500/10 text-red-650 dark:text-red-400 text-[10px] font-black uppercase tracking-wider transition-all hover:bg-red-500/20 disabled:opacity-50 cursor-pointer shadow-xs"
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      Cancel Order
    </button>
  );
}

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
      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.06] transition-all disabled:opacity-50 cursor-pointer"
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      Cancel
    </button>
  );
}

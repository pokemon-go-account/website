"use client";

import { useState, useEffect } from "react";
import { DollarSign, User, TrendingUp, Loader2, Check, X } from "lucide-react";
import { updateOrderInvestmentConsole } from "@/features/console/actions";
import { cn } from "@/lib/utils";

interface OrderInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber?: string;
    totalPrice?: number;
    totalPriceUSD?: number;
    investmentAmount?: number;
    investmentBy?: string;
  } | null;
  onSaved?: (orderId: string, investmentAmount: number, investmentBy: string) => void;
}

export function OrderInvestmentModal({
  isOpen,
  onClose,
  order,
  onSaved,
}: OrderInvestmentModalProps) {
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [investmentBy, setInvestmentBy] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setInvestmentAmount(
        typeof order.investmentAmount === "number" ? order.investmentAmount.toString() : "0"
      );
      setInvestmentBy(order.investmentBy || "");
      setError(null);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const totalRev = order.totalPriceUSD ?? order.totalPrice ?? 0;
  const numericInv = Math.max(0, parseFloat(investmentAmount) || 0);
  const netProfit = totalRev - numericInv;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await updateOrderInvestmentConsole(order.id, numericInv, investmentBy);
      if (res.success) {
        if (onSaved) {
          onSaved(order.id, numericInv, investmentBy);
        }
        onClose();
      } else {
        setError(res.error || "Failed to save investment details.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-widest block">
              Investment Management
            </span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
              <span>{order.orderNumber || `Order #${order.id.substring(0, 8)}`}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Revenue & Profit Quick Summary */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.06] text-center">
            <div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Revenue</span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">
                ${totalRev.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Investment</span>
              <span className="text-xs font-bold text-amber-500 font-mono">
                ${numericInv.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Net Profit</span>
              <span
                className={cn(
                  "text-xs font-bold font-mono",
                  netProfit >= 0 ? "text-emerald-500" : "text-red-500"
                )}
              >
                ${netProfit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Investment Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-amber-500" />
              <span>Investment Amount ($ / ₹)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              placeholder="e.g. 150.00"
              className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#181822] text-sm text-zinc-900 dark:text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all font-mono"
            />
            <p className="text-[10px] text-zinc-400">Total cost spent fulfilling or sourcing this order.</p>
          </div>

          {/* Investment By Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-purple-400" />
              <span>Investment By (Staff / Partner Name)</span>
            </label>
            <input
              type="text"
              value={investmentBy}
              onChange={(e) => setInvestmentBy(e.target.value)}
              placeholder="e.g. Partner A, Staff, Admin Team..."
              className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#181822] text-sm text-zinc-900 dark:text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
            <p className="text-[10px] text-zinc-400">Name of person or partner who provided the investment.</p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-100 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Investment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

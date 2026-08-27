"use client";

import { useEffect, useRef } from "react";
import { DollarSign, CheckCircle, MessageSquare, Copy, ExternalLink, X } from "lucide-react";

export interface ContextMenuPosition {
  x: number;
  y: number;
  order: any;
}

interface OrderContextMenuProps {
  menu: ContextMenuPosition | null;
  onClose: () => void;
  onEditInvestment?: (order: any) => void;
  onMarkCompleted?: (orderId: string) => void;
  onOpenChat?: (orderId: string) => void;
}

export function OrderContextMenu({
  menu,
  onClose,
  onEditInvestment,
  onMarkCompleted,
  onOpenChat,
}: OrderContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (menu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menu, onClose]);

  if (!menu || !menu.order) return null;

  const { x, y, order } = menu;
  const orderId = order.id || order._id;

  // Prevent context menu from clipping off window edges
  const adjustedX = Math.min(x, typeof window !== "undefined" ? window.innerWidth - 220 : x);
  const adjustedY = Math.min(y, typeof window !== "undefined" ? window.innerHeight - 200 : y);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-52 bg-white dark:bg-[#181820] border border-zinc-200 dark:border-white/10 rounded-xl p-1.5 shadow-xl space-y-0.5 text-xs text-zinc-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-white/5 mb-1 flex items-center justify-between">
        <span>Order Actions</span>
        <span className="font-mono text-[9px] text-purple-400">#{orderId.substring(0, 6)}</span>
      </div>

      {/* Option 1: Edit Investment Amount & Investment By */}
      <button
        onClick={() => {
          onClose();
          if (onEditInvestment) onEditInvestment(order);
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 font-semibold cursor-pointer transition-colors text-left"
      >
        <DollarSign className="h-4 w-4 text-amber-500 shrink-0" />
        <span>Edit Investment & Profit</span>
      </button>

      {/* Option 2: Mark Completed (if pending) */}
      {onMarkCompleted && order.status !== "COMPLETED" && (
        <button
          onClick={() => {
            onClose();
            onMarkCompleted(orderId);
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer transition-colors text-left"
        >
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Mark Order Completed</span>
        </button>
      )}

      {/* Option 3: Customer Support Chat */}
      <button
        onClick={() => {
          onClose();
          if (onOpenChat) {
            onOpenChat(orderId);
          } else {
            window.location.href = `/console/chat?chatId=order-${orderId}`;
          }
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 font-semibold cursor-pointer transition-colors text-left"
      >
        <MessageSquare className="h-4 w-4 text-blue-500 shrink-0" />
        <span>Open Order Chat</span>
      </button>

      {/* Option 4: Copy Order ID */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(orderId);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 font-medium cursor-pointer transition-colors text-left border-t border-zinc-100 dark:border-white/5 mt-1 pt-1.5"
      >
        <Copy className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        <span>Copy Order ID</span>
      </button>
    </div>
  );
}

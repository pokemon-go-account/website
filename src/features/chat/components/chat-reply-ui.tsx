"use client";

import React from "react";
import { Reply, X } from "lucide-react";
import { ReplyToPayload, ChatMessage } from "../types";
import { cn } from "@/lib/utils";

/**
 * Scroll to target message element in DOM and briefly highlight it with a ring glow
 */
export function scrollToMessage(targetId?: string) {
  if (!targetId) return;
  const el = document.getElementById(`chat-msg-${targetId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-[#6133e1]", "ring-offset-2", "transition-all", "duration-500");
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-[#6133e1]", "ring-offset-2");
    }, 2000);
  }
}

/**
 * WhatsApp-style Reply Preview Bar displayed directly above the text input
 */
export function ChatReplyInputBar({
  replyingTo,
  onCancel,
}: {
  replyingTo: ChatMessage | null;
  onCancel: () => void;
}) {
  if (!replyingTo) return null;

  const senderName = replyingTo.senderName || (replyingTo.sender === "admin" ? "Support Team" : "Trainer");
  const textSnippet = (replyingTo.text || (replyingTo.image ? "📷 Photo" : "Message")).trim();
  const truncatedText = textSnippet.length > 80 ? textSnippet.slice(0, 80) + "…" : textSnippet || "Original message unavailable";

  return (
    <div className="flex items-center justify-between gap-2 p-2 px-3 mb-2 rounded-xl bg-zinc-200/80 dark:bg-[#1a1a22] border-l-4 border-[#6133e1] shadow-xs text-xs animate-in fade-in slide-in-from-bottom-1 duration-150">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Reply className="h-3.5 w-3.5 text-[#6133e1] shrink-0" />
        <div className="min-w-0">
          <p className="font-bold text-[#6133e1] dark:text-purple-400 text-[11px] truncate leading-tight">
            Replying to {senderName}
          </p>
          <p className="text-zinc-600 dark:text-zinc-300 text-[11px] truncate font-medium leading-snug">
            {truncatedText}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer shrink-0"
        title="Cancel Reply"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Quoted Message Block rendered inside a message bubble when msg.replyTo exists
 */
export function QuotedMessageBlock({
  replyTo,
  isOutgoing,
}: {
  replyTo?: ReplyToPayload;
  isOutgoing: boolean;
}) {
  if (!replyTo) return null;

  const senderName = replyTo.senderName || "User";
  const textSnippet = replyTo.textPreview && replyTo.textPreview.trim()
    ? replyTo.textPreview.trim()
    : "Original message unavailable";

  return (
    <button
      type="button"
      onClick={() => scrollToMessage(replyTo.messageId)}
      className={cn(
        "w-full text-left rounded-lg p-2 px-2.5 mb-1.5 transition-colors cursor-pointer border-l-3 select-none",
        isOutgoing
          ? "bg-white/10 border-white/60 hover:bg-white/20 text-white dark:bg-black/20 dark:border-[#6133e1] dark:hover:bg-black/30 dark:text-zinc-900"
          : "bg-zinc-100 dark:bg-white/[0.06] border-[#6133e1] hover:bg-zinc-200/70 dark:hover:bg-white/10 text-zinc-900 dark:text-white"
      )}
      title="Click to view original message"
    >
      <div className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider opacity-90">
        <Reply className="h-3 w-3 shrink-0" />
        <span className="truncate">{senderName}</span>
      </div>
      <p className="text-[11px] truncate font-normal opacity-85 mt-0.5">
        {textSnippet}
      </p>
    </button>
  );
}

/**
 * Reply Action Button on message bubble hover/focus
 */
export function ReplyActionButton({
  onClick,
  isOutgoing,
}: {
  onClick: () => void;
  isOutgoing: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-full border shadow-xs transition-all opacity-0 group-hover/msg:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shrink-0",
        isOutgoing
          ? "bg-zinc-800 text-zinc-300 border-zinc-700 dark:bg-zinc-100 dark:text-zinc-700 dark:border-zinc-300"
          : "bg-white text-zinc-600 border-zinc-200 dark:bg-[#1a1a20] dark:text-zinc-300 dark:border-white/10"
      )}
      title="Reply to message"
    >
      <Reply className="h-3.5 w-3.5" />
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateContactMessageStatus, deleteContactMessage } from "@/features/contact/actions";
import { ChevronDown, Mail, CheckCircle2, MessageSquare, Loader2, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  UNREAD:  { label: "Unread",  color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/20",   icon: Clock },
  READ:    { label: "Read",    color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",     icon: Mail },
  REPLIED: { label: "Replied", color: "text-emerald-500",bg: "bg-emerald-500/10 border-emerald-500/20",icon: CheckCircle2 },
};

type Status = "UNREAD" | "READ" | "REPLIED";

interface Message {
  _id: string;
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: Status;
  createdAt: string;
}

export function ContactMessagesClient({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [, startTransition] = useTransition();

  const handleStatusChange = (id: string, newStatus: Status) => {
    setUpdating(id);
    startTransition(async () => {
      const res = await updateContactMessageStatus(id, newStatus);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === id ? { ...m, status: newStatus } : m))
        );
      }
      setUpdating(null);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this contact message?")) return;
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteContactMessage(id);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m._id !== id));
        if (expanded === id) setExpanded(null);
      } else {
        alert(res.error || "Failed to delete message.");
      }
      setDeletingId(null);
    });
  };

  const counts = {
    ALL: messages.length,
    UNREAD: messages.filter((m) => m.status === "UNREAD").length,
    READ: messages.filter((m) => m.status === "READ").length,
    REPLIED: messages.filter((m) => m.status === "REPLIED").length,
  };

  const filtered = filter === "ALL" ? messages : messages.filter((m) => m.status === filter);

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "UNREAD", "READ", "REPLIED"] as const).map((s) => {
          const cfg = s === "ALL" ? null : STATUS_CONFIG[s];
          const isActive = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold tracking-tight transition-all cursor-pointer",
                isActive
                  ? "border-zinc-300 dark:border-white/10 bg-zinc-100 dark:bg-white/[0.06] text-zinc-900 dark:text-white"
                  : "border-zinc-200 dark:border-white/[0.06] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {s === "ALL" ? "All" : cfg?.label}
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium border",
                isActive ? "bg-zinc-200 dark:bg-white/10 border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white" : "bg-zinc-100 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.05] text-zinc-400 dark:text-zinc-500"
              )}>
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-zinc-400 dark:text-zinc-650 italic">No messages found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => {
            const cfg = STATUS_CONFIG[msg.status];
            const StatusIcon = cfg.icon;
            const isOpen = expanded === msg._id;

            return (
              <motion.div
                key={msg._id}
                layout
                className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : msg._id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={cn("flex items-center gap-1 text-[10px] font-semibold border px-2.5 py-0.5 rounded-md shrink-0", cfg.bg, cfg.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{msg.name}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{msg.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:block">
                      {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform duration-200", isOpen && "rotate-180")} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-zinc-200 dark:border-white/[0.04]"
                    >
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">From</p>
                            <p className="font-semibold text-zinc-900 dark:text-white">{msg.name}</p>
                            <a href={`mailto:${msg.email}`} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:underline underline-offset-2">{msg.email}</a>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">Sender User ID</p>
                            <p className="font-mono text-zinc-900 dark:text-white select-all text-[11px]">{msg.userId || "Guest Visitor"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">Subject</p>
                            <p className="font-semibold text-zinc-900 dark:text-white">{msg.subject}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-2">Message</p>
                          <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-zinc-950/40 p-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {msg.message}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mr-1">Mark as:</span>
                            {(["UNREAD", "READ", "REPLIED"] as Status[]).map((s) => {
                              const c = STATUS_CONFIG[s];
                              const SIcon = c.icon;
                              const isActive = msg.status === s;
                              return (
                                <button
                                  key={s}
                                  disabled={isActive || updating === msg._id}
                                  onClick={() => handleStatusChange(msg._id, s)}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed",
                                    isActive
                                      ? cn(c.bg, c.color)
                                      : "border-zinc-200 dark:border-white/[0.05] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/10 opacity-80"
                                  )}
                                >
                                  {updating === msg._id && !isActive
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <SIcon className="h-3 w-3" />
                                  }
                                  {c.label}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            disabled={deletingId === msg._id}
                            onClick={() => handleDelete(msg._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === msg._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Delete Message
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

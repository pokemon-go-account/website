"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateContactMessageStatus } from "@/features/contact/actions";
import { ChevronDown, Mail, CheckCircle2, MessageSquare, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  UNREAD:  { label: "Unread",  color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/20",   icon: Clock },
  READ:    { label: "Read",    color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",     icon: Mail },
  REPLIED: { label: "Replied", color: "text-emerald-500",bg: "bg-emerald-500/10 border-emerald-500/20",icon: CheckCircle2 },
};

type Status = "UNREAD" | "READ" | "REPLIED";

interface Message {
  _id: string;
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
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                isActive
                  ? "border-zinc-300 dark:border-white/10 bg-zinc-100 dark:bg-white/[0.06] text-zinc-900 dark:text-white"
                  : "border-zinc-200 dark:border-white/[0.04] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {s === "ALL" ? "All" : cfg?.label}
              <span className={cn(
                "ml-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black border",
                isActive ? "bg-zinc-200 dark:bg-white/10 border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white" : "bg-zinc-100 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.05] text-zinc-400 dark:text-zinc-600"
              )}>
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-zinc-400 dark:text-zinc-600">No messages found.</div>
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
                className="rounded-2xl border border-zinc-200/70 dark:border-white/[0.05] bg-white/60 dark:bg-white/[0.015] overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : msg._id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={cn("flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest border px-2 py-0.5 rounded-full shrink-0", cfg.bg, cfg.color)}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {cfg.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{msg.name}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{msg.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:block">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">From</p>
                            <p className="font-bold text-zinc-900 dark:text-white">{msg.name}</p>
                            <a href={`mailto:${msg.email}`} className="text-violet-600 dark:text-violet-400 hover:underline underline-offset-2">{msg.email}</a>
                          </div>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Subject</p>
                            <p className="font-bold text-zinc-900 dark:text-white">{msg.subject}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Message</p>
                          <div className="rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-zinc-950/40 p-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {msg.message}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mr-1">Mark as:</span>
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
                                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed",
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

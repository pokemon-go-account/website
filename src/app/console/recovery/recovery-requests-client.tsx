"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateRecoveryRequestStatus } from "@/features/recovery/actions";
import {
  CheckCircle2, Clock, Loader2, XCircle, ChevronDown,
  ExternalLink, Calendar, Layers, ShieldCheck, Phone, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  PENDING:     { label: "Pending",     color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/20",  icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",   icon: Loader2 },
  COMPLETED:   { label: "Completed",   color: "text-emerald-500",bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  FAILED:      { label: "Failed",      color: "text-red-500",    bg: "bg-red-500/10 border-red-500/20",     icon: XCircle },
};

const CREATION_METHOD_LABELS: Record<string, string> = {
  google:   "Google Account",
  facebook: "Facebook",
  ptc:      "Pokémon Trainer Club",
  kids:     "Niantic Kids",
  apple:    "Apple ID",
};

const CONTACT_LABELS: Record<string, string> = {
  telegram: "Telegram", discord: "Discord", whatsapp: "WhatsApp",
  instagram: "Instagram", x: "X (Twitter)",
};

type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

interface Request {
  _id: string;
  userId: { _id: string; name: string; email: string; username?: string } | null;
  accountLevel: number;
  screenshotUrl: string;
  startDate: string;
  creationMethod: string;
  contactMethod: string;
  contactId: string;
  alternateContact?: string;
  hasEmailAccess: boolean;
  status: Status;
  createdAt: string;
}

export function RecoveryRequestsClient({ initialRequests }: { initialRequests: Request[] }) {
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Status | "ALL">("ALL");

  const handleStatusChange = (requestId: string, newStatus: Status) => {
    setUpdating(requestId);
    startTransition(async () => {
      const res = await updateRecoveryRequestStatus(requestId, newStatus);
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r._id === requestId ? { ...r, status: newStatus } : r))
        );
      }
      setUpdating(null);
    });
  };

  const filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    IN_PROGRESS: requests.filter((r) => r.status === "IN_PROGRESS").length,
    COMPLETED: requests.filter((r) => r.status === "COMPLETED").length,
    FAILED: requests.filter((r) => r.status === "FAILED").length,
  };

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"] as const).map((s) => {
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
                  : "border-zinc-200 dark:border-white/[0.04] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/[0.08]"
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

      {/* Requests list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-zinc-400 dark:text-zinc-600">
          No recovery requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const cfg = STATUS_CONFIG[req.status];
            const StatusIcon = cfg.icon;
            const isOpen = expanded === req._id;

            return (
              <motion.div
                key={req._id}
                layout
                className="rounded-2xl border border-zinc-200/70 dark:border-white/[0.05] bg-white/60 dark:bg-white/[0.015] overflow-hidden transition-colors"
              >
                {/* Row header (always visible) */}
                <button
                  onClick={() => setExpanded(isOpen ? null : req._id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Status badge */}
                    <span className={cn("flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest border px-2 py-0.5 rounded-full shrink-0", cfg.bg, cfg.color)}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {cfg.label}
                    </span>

                    {/* User info */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {req.userId?.name || req.userId?.email || "Unknown User"}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                        {req.userId?.email || "—"} · Lvl {req.accountLevel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:block">
                      {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform duration-200", isOpen && "rotate-180")} />
                  </div>
                </button>

                {/* Expanded details */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-zinc-200 dark:border-white/[0.04]"
                    >
                      <div className="p-5 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Screenshot */}
                          <div className="lg:col-span-1 space-y-1.5">
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Screenshot</p>
                            <a href={req.screenshotUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 font-semibold group transition-colors">
                              View Image <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                            <div className="mt-1 h-24 w-36 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/[0.06] bg-zinc-100 dark:bg-zinc-950">
                              <img src={req.screenshotUrl} alt="account screenshot" className="h-full w-full object-cover" />
                            </div>
                          </div>

                          {/* Account details */}
                          <div className="space-y-3">
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Account Info</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Layers className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" />
                                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">Level {req.accountLevel}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" />
                                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                                  Started: {new Date(req.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" />
                                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                                  Created via: {CREATION_METHOD_LABELS[req.creationMethod] || req.creationMethod}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ShieldCheck className={cn("h-3.5 w-3.5 shrink-0", req.hasEmailAccess ? "text-emerald-500" : "text-red-500")} />
                                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                                  Email access: {req.hasEmailAccess ? "Yes ✓" : "No ✗"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Contact info */}
                          <div className="space-y-3">
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Contact</p>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{CONTACT_LABELS[req.contactMethod] || req.contactMethod}</p>
                                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{req.contactId}</p>
                                </div>
                              </div>
                              {req.alternateContact && (
                                <div className="flex items-start gap-2">
                                  <Phone className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Alt. contact</p>
                                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{req.alternateContact}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status updater */}
                        <div className="pt-3 border-t border-zinc-200 dark:border-white/[0.04] flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mr-1">Update Status:</span>
                          {(["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"] as Status[]).map((s) => {
                            const c = STATUS_CONFIG[s];
                            const SIcon = c.icon;
                            const isActive = req.status === s;
                            const isLoading = updating === req._id && !isActive;
                            return (
                              <button
                                key={s}
                                disabled={isActive || updating === req._id}
                                onClick={() => handleStatusChange(req._id, s)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed",
                                  isActive
                                    ? cn(c.bg, c.color, "opacity-100")
                                    : "border-zinc-200 dark:border-white/[0.05] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/10 opacity-80"
                                )}
                              >
                                {isLoading && updating === req._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <SIcon className="h-3 w-3" />
                                )}
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

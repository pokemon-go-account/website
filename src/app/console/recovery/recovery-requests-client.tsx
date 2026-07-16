"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateRecoveryRequestStatus, deleteRecoveryRequest } from "@/features/recovery/actions";
import {
  CheckCircle2, Clock, Loader2, XCircle, ChevronDown,
  ExternalLink, Calendar, Layers, ShieldCheck, Phone, MessageSquare,
  Trash2
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
  screenshotUrls?: string[];
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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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

  const handleDelete = (requestId: string) => {
    setDeleting(requestId);
    startTransition(async () => {
      const res = await deleteRecoveryRequest(requestId);
      if (res.success) {
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
        if (expanded === requestId) {
          setExpanded(null);
        }
      } else {
        alert(res.error || "Failed to delete recovery request");
      }
      setDeleting(null);
      setConfirmDeleteId(null);
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

      {/* Requests list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-zinc-400 dark:text-zinc-650 italic">
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
                className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] overflow-hidden"
              >
                {/* Row header (always visible) */}
                <button
                  onClick={() => setExpanded(isOpen ? null : req._id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Status badge */}
                    <span className={cn("flex items-center gap-1 text-[10px] font-semibold border px-2.5 py-0.5 rounded-md shrink-0", cfg.bg, cfg.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>

                    {/* User info */}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {req.userId?.name || req.userId?.email || "Unknown User"}
                      </p>
                      <p className="text-[11px] text-zinc-555 dark:text-zinc-400 truncate mt-0.5">
                        {req.userId?.email || "—"} · Lvl {req.accountLevel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-zinc-450 dark:text-zinc-500 hidden sm:block">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                          {/* Screenshots */}
                          <div className="lg:col-span-1 space-y-1.5">
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                              Screenshots ({req.screenshotUrls?.length || 1})
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {req.screenshotUrls && req.screenshotUrls.length > 0 ? (
                                req.screenshotUrls.map((url, i) => (
                                  <div key={i} className="group relative h-16 w-24 rounded-md overflow-hidden border border-zinc-200 dark:border-white/[0.06] bg-zinc-100 dark:bg-zinc-950 shrink-0">
                                    <img src={url} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" />
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                ))
                              ) : (
                                <div className="group relative h-16 w-24 rounded-md overflow-hidden border border-zinc-200 dark:border-white/[0.06] bg-zinc-100 dark:bg-zinc-950">
                                  <img src={req.screenshotUrl} alt="account screenshot" className="h-full w-full object-cover" />
                                  <a
                                    href={req.screenshotUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Account details */}
                          <div className="space-y-3">
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Account Info</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Layers className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">Level {req.accountLevel}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                                  Started: {new Date(req.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
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
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Contact</p>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{CONTACT_LABELS[req.contactMethod] || req.contactMethod}</p>
                                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{req.contactId}</p>
                                </div>
                              </div>
                              {req.alternateContact && (
                                <div className="flex items-start gap-2">
                                  <Phone className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Alt. contact</p>
                                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{req.alternateContact}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status updater & delete */}
                        <div className="pt-3 border-t border-zinc-200 dark:border-white/[0.04] flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mr-1">Update Status:</span>
                            {(["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"] as Status[]).map((s) => {
                              const c = STATUS_CONFIG[s];
                              const SIcon = c.icon;
                              const isActive = req.status === s;
                              const isLoading = updating === req._id && !isActive;
                              return (
                                <button
                                  key={s}
                                  disabled={isActive || updating === req._id || deleting === req._id}
                                  onClick={() => handleStatusChange(req._id, s)}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed",
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

                          {/* Delete Request Action */}
                          <div className="flex items-center gap-2">
                            {confirmDeleteId === req._id ? (
                              <>
                                <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">Are you sure?</span>
                                <button
                                  disabled={deleting === req._id}
                                  onClick={() => handleDelete(req._id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-650 hover:bg-red-600 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deleting === req._id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                  Yes, Delete
                                </button>
                                <button
                                  disabled={deleting === req._id}
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="inline-flex items-center px-2.5 py-1 rounded border border-zinc-200 dark:border-white/[0.06] text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.02] text-xs font-semibold transition-all cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                disabled={updating === req._id || deleting === req._id}
                                onClick={() => setConfirmDeleteId(req._id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-500/10 text-red-500 hover:bg-red-500/5 dark:hover:bg-red-500/10 hover:border-red-500/20 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete Request
                              </button>
                            )}
                          </div>
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

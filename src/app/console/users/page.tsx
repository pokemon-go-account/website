"use client";

import { useState } from "react";
import { searchUserByUsername, promoteToAdmin, demoteToUser, toggleUserSuspension } from "@/features/console/actions";
import { Users, Search, ShieldCheck, ShieldX, Ban, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoundUser {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  telegramUsername?: string;
  role: string;
  isSuspended: boolean;
  adminRentPaidUntil?: string;
  createdAt: string;
}

export default function ConsoleUsersPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<FoundUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setActionMsg(null);
    const res = await searchUserByUsername(query.trim());
    if (res.success && res.user) {
      setResult(res.user as FoundUser);
    } else {
      setError(res.error || "User not found.");
    }
    setLoading(false);
  };

  const doAction = async (fn: () => Promise<any>, successMsg: string) => {
    setActionLoading(true);
    setActionMsg(null);
    const res = await fn();
    if (res.success) {
      setActionMsg(successMsg);
      // Refresh result
      if (result) {
        const refreshed = await searchUserByUsername(result.username || "");
        if (refreshed.success) setResult(refreshed.user as FoundUser);
      }
    } else {
      setError(res.error || "Action failed.");
    }
    setActionLoading(false);
  };

  const rentExpired = result?.adminRentPaidUntil
    ? new Date(result.adminRentPaidUntil) < new Date()
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Promote Users</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Search by username to promote, demote, or suspend accounts.</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter exact username..."
          className="flex-1 h-8 px-3 bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-900 dark:text-white text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Search className="h-3.5 w-3.5" />
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-650 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {actionMsg && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-450 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {actionMsg}
        </div>
      )}

      {/* User Card */}
      {result && (
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-white/[0.06] dark:bg-[#111111] p-6 space-y-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-950 dark:text-white font-semibold text-sm">{result.name || "Unnamed User"}</p>
              <p className="text-zinc-500 text-xs font-mono mt-1">@{result.username}</p>
              <p className="text-zinc-600 dark:text-zinc-400 text-[10px] mt-1.5">{result.email}</p>
              {result.telegramUsername && (
                <p className="text-zinc-650 dark:text-zinc-400 text-[10px] mt-0.5">Telegram: {result.telegramUsername}</p>
              )}
            </div>
            <div className="text-right space-y-1.5">
              <span className={cn(
                "inline-block px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider",
                result.role === "SUPER_ADMIN" && "border-violet-500/30 bg-violet-500/10 text-violet-400",
                result.role === "ADMIN" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                result.role === "USER" && "border-zinc-200 dark:border-white/[0.06] bg-zinc-100 dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400",
              )}>
                {result.role}
              </span>
              {result.isSuspended && (
                <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">⛔ Suspended</p>
              )}
              {result.role === "ADMIN" && result.adminRentPaidUntil && (
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider", rentExpired ? "text-red-400" : "text-emerald-450")}>
                  Rent {rentExpired ? "EXPIRED" : "valid"} until {new Date(result.adminRentPaidUntil).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-zinc-200 dark:border-white/[0.06] pt-4">
            {result.role === "USER" && (
              <button
                onClick={() => doAction(() => promoteToAdmin(result._id), "User promoted to ADMIN. First 7 days are rent-free.")}
                disabled={actionLoading}
                className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-150 dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Promote to ADMIN
              </button>
            )}
            {result.role === "ADMIN" && (
              <button
                onClick={() => doAction(() => demoteToUser(result._id), "ADMIN demoted back to USER. Access revoked.")}
                disabled={actionLoading}
                className="h-8 px-4 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <ShieldX className="h-3.5 w-3.5" />
                Demote to USER
              </button>
            )}
            <button
              onClick={() => doAction(
                () => toggleUserSuspension(result._id, !result.isSuspended),
                result.isSuspended ? "Account unsuspended." : "Account suspended."
              )}
              disabled={actionLoading || result.role === "SUPER_ADMIN"}
              className="h-8 px-4 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 dark:border-white/[0.08] dark:hover:bg-white/[0.05] dark:text-zinc-400 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Ban className="h-3.5 w-3.5" />
              {result.isSuspended ? "Unsuspend" : "Suspend"} Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

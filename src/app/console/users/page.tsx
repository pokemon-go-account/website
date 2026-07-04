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
    <div className="max-w-2xl space-y-8">
      <div className="border-b border-zinc-200 dark:border-white/[0.05] pb-5">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white">Promote Users</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Search by username to promote, demote, or suspend accounts</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter exact username..."
          className="flex-1 h-10 px-4 bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-950 dark:text-white text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
        >
          <Search className="h-3.5 w-3.5" />
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {actionMsg && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {actionMsg}
        </div>
      )}

      {/* User Card */}
      {result && (
        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.01] p-6 space-y-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-950 dark:text-white font-black text-sm">{result.name || "Unnamed User"}</p>
              <p className="text-zinc-500 text-xs font-mono mt-0.5">@{result.username}</p>
              <p className="text-zinc-600 dark:text-zinc-400 text-[10px] mt-1">{result.email}</p>
              {result.telegramUsername && (
                <p className="text-zinc-655 dark:text-zinc-400 text-[10px]">Telegram: {result.telegramUsername}</p>
              )}
            </div>
            <div className="text-right space-y-1.5">
              <span className={cn(
                "inline-block px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider",
                result.role === "SUPER_ADMIN" && "border-violet-500/30 bg-violet-500/10 text-violet-400",
                result.role === "ADMIN" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                result.role === "USER" && "border-zinc-200 dark:border-white/[0.06] bg-zinc-100 dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400",
              )}>
                {result.role}
              </span>
              {result.isSuspended && (
                <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider">⛔ Suspended</p>
              )}
              {result.role === "ADMIN" && result.adminRentPaidUntil && (
                <p className={cn("text-[9px] font-bold uppercase tracking-wider", rentExpired ? "text-red-400" : "text-emerald-400")}>
                  Rent {rentExpired ? "EXPIRED" : "valid"} until {new Date(result.adminRentPaidUntil).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-zinc-200 dark:border-white/[0.05] pt-4">
            {result.role === "USER" && (
              <button
                onClick={() => doAction(() => promoteToAdmin(result._id), "User promoted to ADMIN. First 7 days are rent-free.")}
                disabled={actionLoading}
                className="h-8 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Promote to ADMIN
              </button>
            )}
            {result.role === "ADMIN" && (
              <button
                onClick={() => doAction(() => demoteToUser(result._id), "ADMIN demoted back to USER. Access revoked.")}
                disabled={actionLoading}
                className="h-8 px-4 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
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
              className="h-8 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 dark:border-white/[0.08] dark:hover:bg-white/[0.05] dark:text-zinc-400 dark:hover:text-white text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
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

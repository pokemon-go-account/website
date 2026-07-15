"use client";

import { useState, useEffect } from "react";
import { getWaitlistEmails, deleteWaitlistEntry } from "@/features/waitlist/actions";
import { Mail, Trash2, Loader2, Download, Users, RefreshCw } from "lucide-react";

interface WaitlistEntry {
  email: string;
  createdAt: string;
}

export function WaitlistPanel() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const res = await getWaitlistEmails();
    if (res.success && res.emails) {
      setEntries(res.emails);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (email: string) => {
    if (!confirm(`Remove ${email} from waitlist?`)) return;
    setDeletingEmail(email);
    await deleteWaitlistEntry(email);
    setEntries((prev) => prev.filter((e) => e.email !== email));
    setDeletingEmail(null);
  };

  const handleExportCSV = () => {
    if (!entries.length) return;
    const csv = ["Email,Joined At", ...entries.map((e) => `${e.email},${new Date(e.createdAt).toLocaleString()}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Sell With Us — Waitlist</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Manage seller program waitlist signups</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={isLoading}
            className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={entries.length === 0}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats card */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
        <div className="h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
          <Users className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="text-xl font-black text-zinc-900 dark:text-white">{entries.length}</p>
          <p className="text-xs text-zinc-500 font-semibold">Total waitlist signups</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Mail className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-semibold text-zinc-500">No waitlist signups yet</p>
            <p className="text-xs text-zinc-400 mt-1">Emails will appear here once users join from the &quot;Sell With Us&quot; page.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Joined</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.03]">
              {entries.map((entry) => (
                <tr key={entry.email} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200 text-xs">{entry.email}</td>
                  <td className="px-4 py-3 text-zinc-500 text-[11px] hidden sm:table-cell">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(entry.email)}
                      disabled={deletingEmail === entry.email}
                      className="h-7 w-7 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/15 flex items-center justify-center ml-auto transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deletingEmail === entry.email ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

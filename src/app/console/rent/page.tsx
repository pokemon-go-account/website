"use client";

import { useState, useEffect } from "react";
import { getAllAdmins, markRentPaid } from "@/features/console/actions";
import { Banknote, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Admin {
  _id: string;
  name?: string;
  username?: string;
  telegramUsername?: string;
  adminRentPaidUntil?: string;
  isSuspended: boolean;
}

export default function ConsoleRentPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await getAllAdmins();
    if (res.success) setAdmins(res.admins || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleMarkPaid = async (admin: Admin) => {
    setProcessingId(admin._id);
    setMessage(null);
    const res = await markRentPaid(admin._id);
    if (res.success) {
      setMessage({ id: admin._id, text: `Rent marked as paid. Valid until ${new Date(res.newExpiry!).toLocaleDateString()}`, ok: true });
      load();
    } else {
      setMessage({ id: admin._id, text: res.error || "Failed.", ok: false });
    }
    setProcessingId(null);
  };

  const buildTelegramReminderUrl = (admin: Admin) => {
    const handle = admin.telegramUsername?.replace("@", "") || "";
    const msg = encodeURIComponent(
      `⚠️ *RENT REMINDER*\n\nHi ${admin.name || admin.username},\n\nYour weekly ADMIN access rent of $2.50 is due.\nPlease send payment and reply to this message to confirm.\n\nYour access will be revoked if rent is not received.`
    );
    return `https://t.me/${handle}?text=${msg}`;
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Rent Manager</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Track $2.50/week rent payments for all ADMINs.</p>
      </div>

      {/* Rent Table Ledger */}
      <div className="border border-zinc-200 dark:border-white/[0.06] rounded-lg overflow-hidden bg-white dark:bg-[#111111] shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/[0.06] text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">ADMIN</th>
                <th className="px-6 py-4">Rent Valid Until</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.06] text-zinc-700 dark:text-zinc-300">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500 italic">Loading rent ledger...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500 italic">No ADMINs found. Promote users via the Users tab first.</td></tr>
              ) : admins.map((admin) => {
                const expired = !admin.adminRentPaidUntil || new Date(admin.adminRentPaidUntil) < new Date();
                const expiryStr = admin.adminRentPaidUntil
                  ? new Date(admin.adminRentPaidUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : "Never paid";

                return (
                  <tr key={admin._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-zinc-900 dark:text-white leading-none">{admin.name || admin.username}</p>
                      <p className="text-zinc-500 font-mono text-[10px] mt-1">@{admin.username}</p>
                      {admin.telegramUsername && (
                        <p className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">{admin.telegramUsername}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-650 dark:text-zinc-300 font-mono">{expiryStr}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider",
                        expired
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      )}>
                        {expired ? "⚠ Overdue" : "✓ Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {message?.id === admin._id && (
                          <span className={cn("text-[10px] font-semibold mr-2", message.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-655 dark:text-red-400")}>
                            {message.text}
                          </span>
                        )}
                        {admin.telegramUsername && (
                          <a
                            href={buildTelegramReminderUrl(admin)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-3 rounded-md border border-zinc-200 hover:bg-zinc-50 dark:border-white/[0.08] dark:hover:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            Send Reminder
                          </a>
                        )}
                        <button
                          onClick={() => handleMarkPaid(admin)}
                          disabled={processingId === admin._id}
                          className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {processingId === admin._id ? "Processing..." : "Mark Paid (+7 days)"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

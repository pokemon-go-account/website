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
      `⚠️ *RENT REMINDER*\n\nHi ${admin.name || admin.username},\n\nYour weekly ADMIN access rent of ₹200 is due.\nPlease send payment and reply to this message to confirm.\n\nYour access will be revoked if rent is not received.`
    );
    return `https://t.me/${handle}?text=${msg}`;
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="border-b border-white/[0.05] pb-5 flex items-center gap-3">
        <Banknote className="h-5 w-5 text-amber-400" />
        <div>
          <h1 className="text-xl font-black text-white">Rent Manager</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Track ₹200/week rent payments for all ADMINs</p>
        </div>
      </div>

      <div className="border border-white/[0.05] rounded-2xl overflow-hidden bg-zinc-950/40 backdrop-blur-md">
        <table className="min-w-full divide-y divide-white/[0.05] text-xs text-left">
          <thead className="bg-white/[0.02] text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">ADMIN</th>
              <th className="px-6 py-4">Rent Valid Until</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
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
                <tr key={admin._id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{admin.name || admin.username}</p>
                    <p className="text-zinc-500 font-mono text-[10px]">@{admin.username}</p>
                    {admin.telegramUsername && (
                      <p className="text-zinc-600 text-[10px]">{admin.telegramUsername}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-300 font-mono">{expiryStr}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider",
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
                        <span className={cn("text-[10px] font-semibold", message.ok ? "text-emerald-400" : "text-red-400")}>
                          {message.text}
                        </span>
                      )}
                      {admin.telegramUsername && (
                        <a
                          href={buildTelegramReminderUrl(admin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-3 rounded-lg border border-white/[0.08] hover:bg-white/[0.05] text-zinc-400 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Send Reminder
                        </a>
                      )}
                      <button
                        onClick={() => handleMarkPaid(admin)}
                        disabled={processingId === admin._id}
                        className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle className="h-3 w-3" />
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
  );
}

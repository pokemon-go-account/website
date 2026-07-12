import { getContactMessages } from "@/features/contact/actions";
import { ContactMessagesClient } from "./contact-messages-client";
import { MessageSquare, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConsoleContactPage() {
  const { success, messages = [], error } = await getContactMessages();

  const counts = {
    total: messages.length,
    unread: messages.filter((m: any) => m.status === "UNREAD").length,
    read: messages.filter((m: any) => m.status === "READ").length,
    replied: messages.filter((m: any) => m.status === "REPLIED").length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Contact Messages</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          View and manage all messages submitted via the Contact Us form.
        </p>
      </div>

      {/* Stats KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-200 dark:bg-white/[0.06] rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.06]">
        {[
          { label: "Total Messages", value: counts.total, color: "text-zinc-900 dark:text-white" },
          { label: "Unread", value: counts.unread, color: "text-amber-500" },
          { label: "Read", value: counts.read, color: "text-zinc-650 dark:text-zinc-300" },
          { label: "Replied", value: counts.replied, color: "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#111111] px-5 py-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {!success && error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <ContactMessagesClient initialMessages={messages} />
    </div>
  );
}

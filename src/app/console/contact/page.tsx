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
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-violet-400" />
          </div>
          <h1 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Contact Messages</h1>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-9">
          View and manage all messages submitted via the Contact Us page.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",   value: counts.total,   color: "text-zinc-900 dark:text-white" },
          { label: "Unread",  value: counts.unread,  color: "text-amber-500" },
          { label: "Read",    value: counts.read,    color: "text-blue-400" },
          { label: "Replied", value: counts.replied, color: "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-200/70 dark:border-white/[0.05] bg-white/50 dark:bg-white/[0.01] p-4 space-y-1">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
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

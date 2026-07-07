import { getRecoveryRequests } from "@/features/recovery/actions";
import { RecoveryRequestsClient } from "./recovery-requests-client";
import { KeyRound, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConsoleRecoveryPage() {
  const { success, requests = [], error } = await getRecoveryRequests();

  const stats = {
    total: requests.length,
    pending: requests.filter((r: any) => r.status === "PENDING").length,
    inProgress: requests.filter((r: any) => r.status === "IN_PROGRESS").length,
    completed: requests.filter((r: any) => r.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <KeyRound className="h-4 w-4 text-cyan-400" />
            </div>
            <h1 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Recovery Requests</h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-9">
            View and manage all Pokémon GO account recovery service orders from trainers.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Requests", value: stats.total, color: "text-zinc-900 dark:text-white" },
          { label: "Pending",        value: stats.pending,    color: "text-amber-500" },
          { label: "In Progress",    value: stats.inProgress, color: "text-blue-400" },
          { label: "Completed",      value: stats.completed,  color: "text-emerald-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-200/70 dark:border-white/[0.05] bg-white/50 dark:bg-white/[0.01] p-4 space-y-1 text-left"
          >
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Error state */}
      {!success && error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Requests list */}
      <RecoveryRequestsClient initialRequests={requests} />
    </div>
  );
}

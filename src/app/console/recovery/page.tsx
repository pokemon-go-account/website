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
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Recovery Requests</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          View and manage all Pokémon GO account recovery service orders from trainers.
        </p>
      </div>

      {/* Summary stats KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-200 dark:bg-white/[0.06] rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.06]">
        {[
          { label: "Total Requests", value: stats.total, color: "text-zinc-900 dark:text-white" },
          { label: "Pending",        value: stats.pending,    color: "text-amber-500" },
          { label: "In Progress",    value: stats.inProgress, color: "text-zinc-650 dark:text-zinc-300" },
          { label: "Completed",      value: stats.completed,  color: "text-emerald-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-[#111111] px-5 py-4 text-left"
          >
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
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

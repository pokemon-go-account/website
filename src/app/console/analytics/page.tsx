"use client";

import { Activity, ShieldCheck, ZapOff } from "lucide-react";

export default function AnalyticsConsolePage() {
  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
          Web Analytics
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Real-time presence and web analytics console status.
        </p>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-xl p-8 text-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
          <ZapOff className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Analytics Telemetry Disabled
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
            Live visitor presence tracking and telemetry pings have been completely disabled on both frontend and backend to protect your Firebase and Vercel quota limits.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-4 text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1 text-emerald-500">
            <ShieldCheck className="h-4 w-4" /> 0 Firebase Quotas Used
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 text-emerald-500">
            <ShieldCheck className="h-4 w-4" /> 0 Vercel Function Calls
          </span>
        </div>
      </div>
    </div>
  );
}

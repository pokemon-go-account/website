"use client";

import { useState } from "react";
import { updateMaintenanceConfig } from "@/features/console/actions";
import { ShieldAlert, Mail, Save, ExternalLink, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SettingsClientProps {
  initialMaintenanceMode: boolean;
  initialContactEmail: string;
}

export function SettingsClient({
  initialMaintenanceMode,
  initialContactEmail,
}: SettingsClientProps) {
  const [maintenanceMode, setMaintenanceMode] = useState(initialMaintenanceMode);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await updateMaintenanceConfig({
        maintenanceMode,
        contactEmail,
      });
      if (res.success) {
        setMaintenanceMode(Boolean(res.maintenanceMode));
        if (res.contactEmail) setContactEmail(res.contactEmail);
        setMessage({ type: "success", text: "Platform maintenance settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update maintenance settings." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Platform Maintenance & System Settings
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Control global site availability, maintenance state, and support contact configurations.
          </p>
        </div>

        <Link
          href="/maintenance"
          target="_blank"
          className="h-8 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Preview Maintenance Page</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={cn(
            "p-4 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all",
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Maintenance Mode Main Control Card */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 space-y-6 shadow-xs">
        
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Maintenance Mode Control
              </h2>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border",
                  maintenanceMode
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                )}
              >
                {maintenanceMode ? "Active (Under Maintenance)" : "Inactive (Public Live)"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              When Maintenance Mode is active, all public visitors will see the dedicated maintenance page. Admins can still access the Console.
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={maintenanceMode}
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              maintenanceMode ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                maintenanceMode ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Contact Email Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-zinc-400" />
            <span>Support Contact Email (Displayed on Maintenance Page)</span>
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="e.g. support@pokemongo.com"
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-purple-500"
          />
          <p className="text-[11px] text-zinc-400">
            This contact email will be presented to visitors on the maintenance screen so they can reach support.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-4">
          <span className="text-[11px] text-zinc-400">
            Changes take effect immediately across all storefront routes.
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Save Settings</span>
          </button>
        </div>

      </div>

      {/* System Status Summary */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          System Scope Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-zinc-500 font-medium">Storefront Traffic</span>
            <p className={cn("text-xs font-bold font-mono", maintenanceMode ? "text-amber-500" : "text-emerald-500")}>
              {maintenanceMode ? "Redirected to Maintenance" : "100% Operational"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-zinc-500 font-medium">Admin Console Access</span>
            <p className="text-xs font-bold font-mono text-emerald-500">
              Always Active for Admins
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-zinc-500 font-medium">Contact Channel</span>
            <p className="text-xs font-bold font-mono text-purple-500 truncate">
              {contactEmail}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, AlertTriangle, HelpCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface LiveRoomDetailsTabProps {
  description: string;
  specRows: Array<{ label: string; value: any; format?: (v: number) => string }>;
  resourceRows: Array<{ label: string; value: any; format?: (v: number) => string }>;
  statPills: Array<{ label: string; value: any; color?: string }>;
}

export function LiveRoomDetailsTab({
  description,
  specRows,
  resourceRows,
  statPills,
}: LiveRoomDetailsTabProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "terms">("overview");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 space-y-6 shadow-xs">
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs font-extrabold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-4 transition-colors border-b-2 ${
              activeTab === "overview"
                ? "border-[#6133e1] text-[#6133e1]"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 px-4 transition-colors border-b-2 ${
              activeTab === "details"
                ? "border-[#6133e1] text-[#6133e1]"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Full Specifications
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`pb-3 px-4 transition-colors border-b-2 ${
              activeTab === "terms"
                ? "border-[#6133e1] text-[#6133e1]"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Guarantees & Terms
          </button>
        </div>

        {/* Tab Contents */}
        <div>
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed font-light whitespace-pre-line">
                {description || "No specific detailed description provided."}
              </div>

              {/* Highlights Pill Badges */}
              {statPills.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6133e1]">Key Telemetry Highlights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {statPills.map((row, idx) => {
                      const displayValue = typeof row.value === "number" ? row.value.toLocaleString() : String(row.value);
                      return (
                        <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-200 font-medium">
                          <Check className="h-4 w-4 text-[#6133e1] shrink-0" />
                          <span>
                            <strong>{row.label}:</strong> {displayValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Security Warning Banner */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-4 text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-3">
                <AlertTriangle className="h-4.5 w-4.5 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-zinc-850 dark:text-white uppercase tracking-wider text-[10px]">Important Security Protocol:</strong>
                  <p className="mt-1 leading-relaxed">
                    We handle full email integration transfers. Credential coordinates are fully changed during secure trade procedures to guarantee permanent account lock protection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {specRows.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#6133e1]">Account Attributes</h3>
                  <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 text-xs">
                    {specRows.map((row, idx) => {
                      const displayValue = row.format && typeof row.value === "number" ? row.format(row.value) : String(row.value);
                      return (
                        <div key={idx} className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-800/60 transition-colors hover:bg-zinc-50/20">
                          <span className="text-zinc-500 dark:text-zinc-400">{row.label}</span>
                          <span className="font-semibold text-zinc-800 dark:text-white">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {resourceRows.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#6133e1]">Items & Inventory</h3>
                  <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 text-xs">
                    {resourceRows.map((row, idx) => {
                      const displayValue = row.format && typeof row.value === "number" ? row.format(row.value) : String(row.value);
                      return (
                        <div key={idx} className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-800/60 transition-colors hover:bg-zinc-50/20">
                          <span className="text-zinc-500 dark:text-zinc-400">{row.label}</span>
                          <span className="font-semibold text-zinc-800 dark:text-white">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-6 text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed font-light animate-in fade-in duration-300">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Account Handover Terms</h4>
                <p>
                  We guarantee a secure transfer pipeline. Upon auction finalization, our admins check account credentials and deliver login keys within minutes.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Refund Policy</h4>
                <p>
                  A 7-Day Money Back Guarantee protects you. If account details do not match catalog specs, you are eligible for an immediate complete refund.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accordion FAQs Panel */}
      <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
          <HelpCircle className="h-4.5 w-4.5 text-[#6133e1]" />
          Frequently Asked Questions
        </h3>

        <div className="space-y-2">
          {[
            { q: "Will I get full access to the account?", a: "Yes. You will receive complete credentials including login access keys to the linked Google/PTC account coordinates." },
            { q: "Is the account safe from bans?", a: "Absoluty. All listings undergo authentication review by administrators to ensure they are clean and have no active warnings or strikes." },
            { q: "How will I receive the account details?", a: "Admins automate the delivery. You will receive a secure system notification as soon as deposit and purchase balances are finalized." },
            { q: "Can I change the email and password?", a: "Yes. Changing email links is a mandatory step in our secure onboarding handbook." }
          ].map((item, idx) => (
            <div key={idx} className="border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between py-2.5 text-left text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <span>{openFaq === idx ? "−" : "+"}</span>
              </button>
              {openFaq === idx && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pb-3 leading-relaxed font-light">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trust Assurance Block */}
      <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 flex flex-col sm:flex-row items-center gap-6 justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <ShieldAlert className="h-10 w-10 text-[#6133e1] shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Bid With Complete Confidence</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Your payments are fully protected under our 7-Day Money Back Guarantee structure.</p>
          </div>
        </div>
        <Link
          href="/contact"
          className="text-[10px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-widest border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          Safe Trade Seal
        </Link>
      </div>
    </div>
  );
}

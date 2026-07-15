import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import WisePayment from "@/models/WisePayment";
import { Clock, CheckCircle2, XCircle, Euro, Inbox } from "lucide-react";
import { WisePaymentActions } from "./payment-actions-client";

export const revalidate = 0;

const STATUS_CONFIG = {
  Pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  },
  Verified: {
    label: "Verified",
    icon: CheckCircle2,
    className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  },
  Rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
  },
};

export default async function WisePaymentsConsolePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  await connectDB();

  const paymentDocs = await WisePayment.find({ status: "Pending" })
    .sort({ createdAt: -1 })
    .lean();

  const payments = paymentDocs.map((p: any) => ({
    id: p._id.toString(),
    orderId: p.orderId,
    amount: p.amount,
    currency: p.currency || "USD",
    customerEmail: p.customerEmail,
    transactionReference: p.transactionReference,
    screenshotUrl: p.screenshotUrl,
    status: p.status as "Pending" | "Verified" | "Rejected",
    createdAt: new Date(p.createdAt).toLocaleString("en-IE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Wise Payment Verifications
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Review and verify pending Wise money transfer submissions.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 animate-pulse">
          <Clock className="h-3 w-3" />
          {payments.length} Pending
        </span>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-white/[0.06] rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.06]">
        {[
          { label: "Pending Review", value: payments.length, color: "text-amber-500" },
          {
            label: "Total Submissions",
            value: payments.length,
            color: "text-zinc-900 dark:text-white",
          },
          { label: "Today", value: payments.filter((p) => new Date(p.createdAt).toDateString() === new Date().toDateString()).length, color: "text-blue-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-[#111111] px-5 py-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/[0.04] flex items-center justify-center">
            <Inbox className="h-5 w-5 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-white">No pending payments</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            All Wise submissions have been reviewed.
          </p>
        </div>
      ) : (
        /* Payments Table */
        <div className="rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 dark:divide-white/[0.04] text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-white/[0.02]">
                  {["Order ID", "Amount", "Customer", "Reference", "Submitted", "Status", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                {payments.map((p) => {
                  const cfg = STATUS_CONFIG[p.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Order ID */}
                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {p.orderId}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-zinc-900 dark:text-white text-sm">
                          {p.currency === "EUR" ? "€" : p.currency === "USD" ? "$" : p.currency === "INR" ? "₹" : p.currency + " "}
                          {p.amount.toLocaleString("en-IE", { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Customer Email */}
                      <td className="px-4 py-3 text-[11px] text-zinc-600 dark:text-zinc-400 max-w-[160px] truncate">
                        {p.customerEmail}
                      </td>

                      {/* Reference */}
                      <td className="px-4 py-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-450 whitespace-nowrap font-semibold tracking-wider max-w-[150px] truncate" title={p.transactionReference}>
                        {p.transactionReference}
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {p.createdAt}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <WisePaymentActions
                          paymentId={p.id}
                          screenshotUrl={p.screenshotUrl}
                          transactionReference={p.transactionReference}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

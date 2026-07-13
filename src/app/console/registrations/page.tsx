"use client";

import { useState, useEffect, useRef } from "react";
import {
  getRegistrationsConsole,
  verifyRegistrationConsole,
  failRegistrationConsole,
  deleteRegistrationConsole,
  createRegistrationManuallyConsole
} from "@/features/console/actions";
import { CreditCard, Check, X, Trash2, Search, CheckCircle, AlertTriangle, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationData {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
    telegramUsername?: string;
  };
  auctionId: {
    _id: string;
    listingId?: {
      _id: string;
      title: string;
      startingBid: number;
    };
  };
  razorpayOrderId: string;
  status: "PENDING" | "PAID" | "FAILED";
  createdAt: string;
}

export default function RegistrationsConsolePage() {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "PAID" | "FAILED">("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ text: string; ok: boolean } | null>(null);

  const [manualUsername, setManualUsername] = useState("");
  const [formPending, setFormPending] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchRegistrations = async (pageNum: number, resetList: boolean = false) => {
    if (resetList) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setAlert(null);
    try {
      const res = await getRegistrationsConsole(pageNum, 100, debouncedSearch, activeTab);
      if (res.success && res.registrations) {
        const fetchedRegs = res.registrations as RegistrationData[];
        if (resetList) {
          setRegistrations(fetchedRegs);
        } else {
          setRegistrations((prev) => {
            const existingIds = new Set(prev.map(r => r._id));
            const newRegs = fetchedRegs.filter(r => !existingIds.has(r._id));
            return [...prev, ...newRegs];
          });
        }
        setHasMore(res.hasMore ?? false);
        setTotalCount(res.totalCount ?? 0);
        setPage(pageNum);
      } else {
        setAlert({ text: res.error || "Failed to load registrations.", ok: false });
      }
    } catch (err: any) {
      setAlert({ text: err.message || "Failed to fetch registrations.", ok: false });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Reload registrations on search query or tab change
  useEffect(() => {
    fetchRegistrations(1, true);
  }, [debouncedSearch, activeTab]);

  // Infinite Scroll intersection observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchRegistrations(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, [hasMore, loading, loadingMore, page, debouncedSearch, activeTab]);

  const handleVerify = async (id: string) => {
    setProcessingId(id);
    setAlert(null);
    const res = await verifyRegistrationConsole(id);
    if (res.success) {
      setAlert({ text: "Registration verified manually.", ok: true });
      setRegistrations(prev => prev.map(r => r._id === id ? { ...r, status: "PAID" } : r));
    } else {
      setAlert({ text: res.error || "Verification failed.", ok: false });
    }
    setProcessingId(null);
  };

  const handleFail = async (id: string) => {
    setProcessingId(id);
    setAlert(null);
    const res = await failRegistrationConsole(id);
    if (res.success) {
      setAlert({ text: "Registration marked as failed.", ok: true });
      setRegistrations(prev => prev.map(r => r._id === id ? { ...r, status: "FAILED" } : r));
    } else {
      setAlert({ text: res.error || "Action failed.", ok: false });
    }
    setProcessingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this registration document?")) return;
    setProcessingId(id);
    setAlert(null);
    const res = await deleteRegistrationConsole(id);
    if (res.success) {
      setAlert({ text: "Registration deleted successfully.", ok: true });
      setRegistrations(prev => prev.filter(r => r._id !== id));
      setTotalCount(prev => prev - 1);
    } else {
      setAlert({ text: res.error || "Delete failed.", ok: false });
    }
    setProcessingId(null);
  };

  const handleManualRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUsername.trim()) return;
    setFormPending(true);
    setAlert(null);
    const res = await createRegistrationManuallyConsole(manualUsername.trim());
    if (res.success) {
      setAlert({ text: `Successfully registered and marked paid bidder @${manualUsername.trim()} globally!`, ok: true });
      setManualUsername("");
      fetchRegistrations(1, true);
    } else {
      setAlert({ text: res.error || "Manual registration failed.", ok: false });
    }
    setFormPending(false);
  };

  return (
    <div className="max-w-6xl space-y-8">
      {/* Title */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Bidder Registrations</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage and manually override bidder live entry deposits ($2.50).</p>
      </div>

      {/* Alerts */}
      {alert && (
        <div
          className={cn(
            "rounded-md border p-3 text-xs flex items-center gap-2",
            alert.ok
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450"
              : "border-red-500/20 bg-red-500/5 text-red-400"
          )}
        >
          {alert.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {alert.text}
        </div>
      )}

      {/* Manual Bidder Registration Form */}
      <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
          <CreditCard className="h-4 w-4 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Register Bidder Manually</h3>
        </div>
        <form onSubmit={handleManualRegisterSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end max-w-xl">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">Bidder Username</label>
            <input
              type="text"
              value={manualUsername}
              onChange={(e) => setManualUsername(e.target.value)}
              placeholder="e.g. trainer_red"
              required
              className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={formPending || !manualUsername.trim()}
            className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-150 dark:text-zinc-900 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            {formPending ? "Registering..." : "Confirm & Mark Paid"}
          </button>
        </form>
      </div>

      {/* Search and Tabs Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Pills */}
        <div className="flex border border-zinc-200 dark:border-white/[0.06] bg-zinc-100/50 dark:bg-white/[0.02] p-1 rounded-md gap-1">
          {(["ALL", "PENDING", "PAID", "FAILED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "h-7 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer",
                activeTab === tab
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username, title, order ID..."
            className="w-full h-8 pl-9 pr-4 bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white text-xs placeholder:text-zinc-450 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="border border-zinc-200 dark:border-white/[0.06] rounded-lg overflow-x-auto bg-white dark:bg-[#111111] shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/[0.06] text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Bidder Details</th>
                <th className="px-6 py-4">Target Auction</th>
                <th className="px-6 py-4">Payment Transaction</th>
                <th className="px-6 py-4">Registered Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.05] text-zinc-700 dark:text-zinc-300">
              {loading && registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">
                    Loading registrations ledger...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic font-medium">
                    No registrations found matching parameters.
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => {
                  const regDate = new Date(reg.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={reg._id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors"
                    >
                      {/* Bidder Profile */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white">
                          {reg.userId?.name || "Unnamed Trainer"}
                        </div>
                        <div className="text-zinc-500 font-mono text-[10px]">
                          @{reg.userId?.username || "no_username"}
                        </div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                          {reg.userId?.email}
                        </div>
                        {reg.userId?.telegramUsername && (
                          <div className="text-[#24A1DE] text-[9px] font-semibold flex items-center gap-0.5 mt-0.5">
                            <MessageSquare className="h-2.5 w-2.5" /> {reg.userId.telegramUsername}
                          </div>
                        )}
                      </td>

                      {/* Auction coordinate */}
                      <td className="px-6 py-4 max-w-[200px]">
                        {reg.auctionId ? (
                          <>
                            <div className="font-semibold text-zinc-900 dark:text-white truncate">
                              {reg.auctionId?.listingId?.title || "Unknown listing"}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">
                              Auction ID: {reg.auctionId?._id?.substring(0, 12)}...
                            </div>
                          </>
                        ) : (
                          <div className="font-semibold text-emerald-600 dark:text-emerald-500">
                            Global (All Auctions)
                          </div>
                        )}
                      </td>

                      {/* Payment/Deposit Order ID */}
                      <td className="px-6 py-4">
                        <div className="font-mono text-zinc-650 dark:text-zinc-300 font-semibold">
                          {reg.razorpayOrderId}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-bold mt-0.5">
                          $2.50 USD
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-zinc-500 font-mono">
                        {regDate}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider",
                            reg.status === "PAID" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                            reg.status === "PENDING" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                            reg.status === "FAILED" && "border-red-500/30 bg-red-500/10 text-red-400"
                          )}
                        >
                          {reg.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {reg.status !== "PAID" && (
                            <button
                              onClick={() => handleVerify(reg._id)}
                              disabled={processingId === reg._id}
                              className="h-7 w-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                              title="Mark Paid / Verify"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {reg.status === "PENDING" && (
                            <button
                              onClick={() => handleFail(reg._id)}
                              disabled={processingId === reg._id}
                              className="h-7 w-7 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.05] text-zinc-650 dark:text-zinc-450 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                              title="Mark Failed"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(reg._id)}
                            disabled={processingId === reg._id}
                            className="h-7 w-7 rounded-lg bg-red-600/80 hover:bg-red-550 text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div ref={observerTarget} className="flex justify-center p-6 border-t border-zinc-200 dark:border-white/[0.05]">
            <Loader2 className="h-4 w-4 animate-spin text-[#6133e1]" />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { 
  getAllUsers, 
  promoteToAdmin, 
  demoteToUser, 
  toggleUserSuspension, 
  updateUserWalletBalance 
} from "@/features/console/actions";
import { 
  Users, Search, ShieldCheck, ShieldX, Ban, CheckCircle, 
  AlertTriangle, Loader2, Mail, Calendar, Wallet, Check, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "@/components/price-display";

interface FoundUser {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  telegramUsername?: string;
  role: string;
  isSuspended: boolean;
  walletBalance: number;
  adminRentPaidUntil?: string;
  createdAt: string;
}

export default function ConsoleUsersPage() {
  const [users, setUsers] = useState<FoundUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<FoundUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Pagination & Loading states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  
  // Messages
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  
  // Balance Form State
  const [newBalance, setNewBalance] = useState("");

  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchUsers = async (pageNum: number, resetList: boolean = false) => {
    if (resetList) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const res = await getAllUsers(pageNum, 100, debouncedSearch);
      if (res.success && res.users) {
        const fetchedUsers = res.users as FoundUser[];
        if (resetList) {
          setUsers(fetchedUsers);
          // If we had a selected user, try to sync their data from the new list
          if (selectedUser) {
            const updatedSelected = fetchedUsers.find((u) => u._id === selectedUser._id);
            if (updatedSelected) {
              setSelectedUser(updatedSelected);
              setNewBalance(updatedSelected.walletBalance.toString());
            }
          }
        } else {
          setUsers((prev) => {
            const existingIds = new Set(prev.map(u => u._id));
            const newUsers = fetchedUsers.filter(u => !existingIds.has(u._id));
            return [...prev, ...newUsers];
          });
        }
        setHasMore(res.hasMore ?? false);
        setTotalCount(res.totalCount ?? 0);
        setPage(pageNum);
      } else {
        setError(res.error || "Failed to load users list.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger load on debounced search change
  useEffect(() => {
    fetchUsers(1, true);
  }, [debouncedSearch]);

  // Infinite Scroll Intersection Observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchUsers(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, [hasMore, loading, loadingMore, page, debouncedSearch]);

  const handleSelectUser = (user: FoundUser) => {
    setSelectedUser(user);
    setNewBalance(user.walletBalance.toString());
    setActionMsg(null);
    setError(null);
  };

  const doAction = async (
    fn: () => Promise<any>, 
    successMsg: string, 
    updateLocalState: () => void
  ) => {
    setActionLoading(true);
    setError(null);
    setActionMsg(null);
    try {
      const res = await fn();
      if (res.success) {
        setActionMsg(successMsg);
        updateLocalState();
      } else {
        setError(res.error || "Action failed.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const parsedBalance = parseFloat(newBalance);
    if (isNaN(parsedBalance)) {
      setError("Please enter a valid numeric balance.");
      return;
    }

    setBalanceLoading(true);
    setError(null);
    setActionMsg(null);
    
    try {
      const res = await updateUserWalletBalance(selectedUser._id, parsedBalance);
      if (res.success) {
        setActionMsg(`Successfully updated balance for @${selectedUser.username} to $${parsedBalance.toFixed(2)}`);
        const updated = { ...selectedUser, walletBalance: parsedBalance };
        setUsers(prev => prev.map(u => u._id === selectedUser._id ? updated : u));
        setSelectedUser(updated);
      } else {
        setError(res.error || "Failed to update wallet balance.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update balance.");
    } finally {
      setBalanceLoading(false);
    }
  };

  const rentExpired = selectedUser?.adminRentPaidUntil
    ? new Date(selectedUser.adminRentPaidUntil) < new Date()
    : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">User Directory</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage roles, account suspensions, and wallet balances for all registered accounts.
          </p>
        </div>
        <div className="text-xs text-zinc-450 dark:text-zinc-500 bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold select-none">
          <Users className="h-3.5 w-3.5" />
          <span>{totalCount} Users Registered</span>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#6133e1]" />
          <p className="text-xs text-zinc-500">Loading user catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Users List */}
          <div className="lg:col-span-5 rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] overflow-hidden flex flex-col h-[520px]">
            
            {/* List Search Bar */}
            <div className="p-3 border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-black/10 relative">
              <Search className="absolute left-6 top-[22px] -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-550" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, username, or email..."
                className="w-full h-8 pl-8 pr-3 bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-900 dark:text-white text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-zinc-300 dark:focus:border-white/20 transition-all font-medium"
              />
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-white/[0.04] scrollbar-thin">
              {users.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-500">No users found.</div>
              ) : (
                users.map((u) => {
                  const isSelected = selectedUser?._id === u._id;
                  return (
                    <button
                      key={u._id}
                      onClick={() => handleSelectUser(u)}
                      className={cn(
                        "w-full p-3.5 text-left flex items-center justify-between transition-colors cursor-pointer group",
                        isSelected 
                          ? "bg-[#6133e1]/5 dark:bg-[#6133e1]/10 border-l-2 border-[#6133e1]" 
                          : "hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "font-semibold text-xs truncate",
                            isSelected ? "text-[#6133e1] dark:text-purple-400" : "text-zinc-900 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white"
                          )}>
                            {u.name || "Unnamed User"}
                          </span>
                          <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none shrink-0",
                            u.role === "SUPER_ADMIN" && "border-violet-500/20 bg-violet-500/5 text-violet-400",
                            u.role === "ADMIN" && "border-amber-500/20 bg-amber-500/5 text-amber-400",
                            u.role === "USER" && "border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400"
                          )}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono mt-0.5">@{u.username}</p>
                      </div>

                      {/* Wallet Balance Tag in List */}
                      <div className="text-right shrink-0">
                        <span className={cn(
                          "text-xs font-bold font-mono px-2 py-1 rounded bg-opacity-10 border border-opacity-20",
                          u.walletBalance < 0 
                            ? "bg-red-500/10 border-red-500/30 text-red-550 dark:text-red-400" 
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-650 dark:text-emerald-400"
                        )}>
                          <PriceDisplay amountInUSD={u.walletBalance} />
                        </span>
                      </div>
                    </button>
                  );
                })
              )}

              {/* Infinite Scroll Trigger */}
              {hasMore && (
                <div ref={observerTarget} className="flex justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[#6133e1]" />
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Active User Details & Actions Inspector */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Feedbacks / Errors */}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3.5 text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5 shadow-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {actionMsg && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-450 flex items-start gap-2.5 shadow-sm">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{actionMsg}</span>
              </div>
            )}

            {selectedUser ? (
              <div className="rounded-lg border border-zinc-200 bg-white dark:border-white/[0.06] dark:bg-[#111111] p-6 space-y-6 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* User Info Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-200 dark:border-white/[0.06] pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-zinc-950 dark:text-white tracking-tight">{selectedUser.name || "Unnamed User"}</h2>
                      {selectedUser.isSuspended && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded">
                          ⛔ Suspended
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#6133e1] dark:text-purple-400 font-mono">@{selectedUser.username}</p>
                    <div className="flex flex-col gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 font-medium">
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {selectedUser.email}</span>
                      {selectedUser.telegramUsername && (
                        <span className="flex items-center gap-1.5 text-sky-500">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701-.332 4.975c.488 0 .703-.223.976-.488l2.343-2.278 4.873 3.6c.898.496 1.543.241 1.767-.83l3.194-15.048c.328-1.312-.492-1.907-1.352-1.521z"/></svg>
                          Telegram: {selectedUser.telegramUsername}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="sm:text-right space-y-2">
                    <span className={cn(
                      "inline-block px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shadow-xs",
                      selectedUser.role === "SUPER_ADMIN" && "border-violet-500/30 bg-violet-500/10 text-violet-400",
                      selectedUser.role === "ADMIN" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                      selectedUser.role === "USER" && "border-zinc-200 dark:border-white/[0.06] bg-zinc-150 dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400",
                    )}>
                      Role: {selectedUser.role}
                    </span>
                    {selectedUser.role === "ADMIN" && selectedUser.adminRentPaidUntil && (
                      <p className={cn("text-[9px] font-semibold uppercase tracking-wider mt-1.5 block", rentExpired ? "text-red-400 animate-pulse" : "text-emerald-450")}>
                        Rent {rentExpired ? "Expired" : "Paid"} until {new Date(selectedUser.adminRentPaidUntil).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* WALLET BALANCE UPDATE TOOL */}
                <div className="bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/[0.04] rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-650 dark:text-zinc-400 flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-[#6133e1]" />
                      Wallet Balance Controls
                    </h3>
                    <span className={cn(
                      "text-xs font-bold font-mono px-2 py-0.5 rounded border",
                      selectedUser.walletBalance < 0 
                        ? "border-red-500/20 bg-red-500/10 text-red-550 dark:text-red-400" 
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400"
                    )}>
                      Current: <PriceDisplay amountInUSD={selectedUser.walletBalance} />
                    </span>
                  </div>

                  <form onSubmit={handleUpdateBalance} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1.5">
                      <label htmlFor="balance-input" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                        Set New Wallet Balance ($ USD)
                      </label>
                      <input
                        id="balance-input"
                        type="number"
                        step="0.01"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-8 px-3 bg-white dark:bg-[#151515] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-900 dark:text-white text-xs font-semibold focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={balanceLoading}
                      className="h-8 px-4 rounded-md bg-[#6133e1] hover:bg-[#5229be] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60 shrink-0 shadow-xs"
                    >
                      {balanceLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Update Balance
                    </button>
                  </form>

                  <div className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-normal flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      Balances are positive (e.g. `+$2.50`) when users deposit refundable auction verification fees or have storefront credits.
                    </span>
                  </div>
                </div>

                {/* ROLE MANAGEMENT & BAN ACTION BUTTONS */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-650 dark:text-zinc-400">
                    Administrative Privileges
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedUser.role === "USER" && (
                      <button
                        onClick={() => doAction(
                          () => promoteToAdmin(selectedUser._id), 
                          "User promoted to ADMIN. 7-day grace period applied.",
                          () => {
                            const rentFreeUntil = new Date();
                            rentFreeUntil.setDate(rentFreeUntil.getDate() + 7);
                            const updated = { ...selectedUser, role: "ADMIN", adminRentPaidUntil: rentFreeUntil.toISOString() };
                            setUsers(prev => prev.map(u => u._id === selectedUser._id ? updated : u));
                            setSelectedUser(updated);
                          }
                        )}
                        disabled={actionLoading}
                        className="h-8 px-4 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Promote to ADMIN
                      </button>
                    )}
                    {selectedUser.role === "ADMIN" && (
                      <button
                        onClick={() => doAction(
                          () => demoteToUser(selectedUser._id), 
                          "ADMIN demoted back to USER role.",
                          () => {
                            const updated = { ...selectedUser, role: "USER", adminRentPaidUntil: undefined };
                            setUsers(prev => prev.map(u => u._id === selectedUser._id ? updated : u));
                            setSelectedUser(updated);
                          }
                        )}
                        disabled={actionLoading}
                        className="h-8 px-4 rounded-md bg-red-650 hover:bg-red-550 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                      >
                        <ShieldX className="h-4 w-4" />
                        Demote to USER
                      </button>
                    )}
                    <button
                      onClick={() => doAction(
                        () => toggleUserSuspension(selectedUser._id, !selectedUser.isSuspended),
                        selectedUser.isSuspended ? "Account unsuspended." : "Account suspended successfully.",
                        () => {
                          const updated = { ...selectedUser, isSuspended: !selectedUser.isSuspended };
                          setUsers(prev => prev.map(u => u._id === selectedUser._id ? updated : u));
                          setSelectedUser(updated);
                        }
                      )}
                      disabled={actionLoading || selectedUser.role === "SUPER_ADMIN"}
                      className={cn(
                        "h-8 px-4 rounded-md border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50",
                        selectedUser.isSuspended
                          ? "bg-red-500/10 border-red-500/30 text-red-550 hover:bg-red-500/20"
                          : "border-zinc-200 hover:bg-zinc-50 text-zinc-600 dark:border-white/[0.08] dark:hover:bg-white/[0.05] dark:text-zinc-400 dark:hover:text-white"
                      )}
                    >
                      <Ban className="h-4 w-4" />
                      {selectedUser.isSuspended ? "Unsuspend Account" : "Suspend Account"}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.06] bg-zinc-50/30 dark:bg-[#111111]/30 p-20 text-center flex flex-col items-center justify-center gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center text-zinc-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-zinc-800 dark:text-zinc-200 text-xs font-bold uppercase tracking-wider">No User Selected</h3>
                  <p className="text-zinc-450 dark:text-zinc-500 text-[11px] mt-1 max-w-xs leading-relaxed">
                    Click a user from the directory list on the left to edit their details, promote roles, or adjust wallet balance coordinates.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}

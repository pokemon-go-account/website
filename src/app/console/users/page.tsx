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
  AlertTriangle, Loader2, Mail, Calendar, Wallet, Check, AlertCircle, MessageSquare, Globe 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PriceDisplay } from "@/components/price-display";

interface FoundUser {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  telegramUsername?: string;
  preferredContactMethod?: string;
  preferredContactId?: string;
  alternateContact?: string;
  country?: string;
  role: string;
  isSuspended: boolean;
  walletBalance: number;
  adminRentPaidUntil?: string;
  createdAt: string;
}

function renderContactMethod(method: string, contactId: string) {
  const normalizedMethod = method.toLowerCase();
  
  switch (normalizedMethod) {
    case "telegram":
      return (
        <span className="flex items-center gap-1.5 text-sky-500">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701-.332 4.975c.488 0 .703-.223.976-.488l2.343-2.278 4.873 3.6c.898.496 1.543.241 1.767-.83l3.194-15.048c.328-1.312-.492-1.907-1.352-1.521z"/></svg>
          Telegram: {contactId}
        </span>
      );
    case "facebook":
      return (
        <span className="flex items-center gap-1.5 text-[#1877F2] font-semibold">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook: {contactId}
        </span>
      );
    case "discord":
      return (
        <span className="flex items-center gap-1.5 text-[#5865F2] font-semibold">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/></svg>
          Discord: {contactId}
        </span>
      );
    case "whatsapp":
      return (
        <span className="flex items-center gap-1.5 text-[#25D366] font-semibold">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.167 1.455 4.796 1.457 5.4 0 9.792-4.394 9.795-9.797.002-2.618-1.01-5.08-2.858-6.93C16.43 2.033 13.96 1.018 12.01 1.017 6.61 1.017 2.215 5.41 2.212 10.814c0 1.69.443 3.34 1.284 4.787l-.997 3.638 3.73-.978zm11.39-7.393c-.302-.15-1.785-.88-2.062-.98-.277-.1-.478-.15-.68.15-.202.3-.777.98-.953 1.18-.175.2-.352.224-.654.074-1.1-.55-1.926-.95-2.678-2.24-.2-.343.2-.317.57-.962.115-.23.057-.43-.028-.58-.086-.15-.68-1.64-.93-2.24-.24-.58-.48-.5-.68-.51-.173-.008-.373-.01-.573-.01-.2 0-.527.075-.803.374-.277.3-1.055 1.03-1.055 2.515s1.08 2.92 1.23 3.12c.15.2 2.126 3.25 5.15 4.56 2.05.89 3.05 1.02 4.14.86.64-.09 1.97-.8 2.24-1.57.277-.77.277-1.43.196-1.57-.08-.14-.3-.22-.6-.37z"/></svg>
          WhatsApp: {contactId}
        </span>
      );
    case "instagram":
      return (
        <span className="flex items-center gap-1.5 text-[#E1306C] font-semibold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
          Instagram: {contactId}
        </span>
      );
    case "reddit":
      return (
        <span className="flex items-center gap-1.5 text-[#FF4500] font-semibold">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.75-1.64-5.99-1.72l1.2-3.78 3.9 1c.04.94.82 1.7 1.8 1.7 1 0 1.8-.8 1.8-1.8S20.5 3.5 19.5 3.5c-.8 0-1.5.5-1.7 1.2l-4.4-1.1c-.24-.05-.48.09-.54.33l-1.38 4.4C9.25 8.4 7.07 9.04 5.4 10.04c-.56-.76-1.46-1.24-2.46-1.24-1.65 0-3 1.35-3 3 0 1.2.7 2.23 1.7 2.7-.06.33-.1.66-.1 1 0 3.6 4.3 6.5 9.5 6.5 5.2 0 9.5-2.9 9.5-6.5 0-.34-.04-.67-.1-1 1-.47 1.7-1.5 1.7-2.7zm-18.5 2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8zm11 3.5c-1.5 1.5-4.4 1.5-5.9 0-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 1.1 1.1 3.4 1.1 4.5 0 .2-.2.5-.2.7 0 .2.2.2.5 0 .7zm-.3-1.7c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8z"/></svg>
          Reddit: {contactId}
        </span>
      );
    case "x":
      return (
        <span className="flex items-center gap-1.5 text-zinc-950 dark:text-white font-semibold">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X (Twitter): {contactId}
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 text-violet-500 dark:text-violet-400 capitalize font-semibold">
          <MessageSquare className="h-3.5 w-3.5" />
          {method}: {contactId}
        </span>
      );
  }
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
                      {selectedUser.preferredContactMethod && selectedUser.preferredContactId ? (
                        renderContactMethod(selectedUser.preferredContactMethod, selectedUser.preferredContactId)
                      ) : selectedUser.telegramUsername ? (
                        renderContactMethod("telegram", selectedUser.telegramUsername)
                      ) : null}

                      {selectedUser.alternateContact && (
                        <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                          <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                          Alternate Contact: {selectedUser.alternateContact}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                      {selectedUser.country && (
                        <span className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" /> {selectedUser.country}
                        </span>
                      )}
                      
                      <Link
                        href={`/console/chat?userId=${selectedUser._id}&username=${encodeURIComponent(selectedUser.username || "")}&email=${encodeURIComponent(selectedUser.email || "")}`}
                        className="mt-2.5 inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg bg-[#6133e1]/10 text-[#6133e1] dark:text-[#8b5cf6] hover:bg-[#6133e1]/20 border border-[#6133e1]/20 text-[10px] font-bold uppercase transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat Directly
                      </Link>
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

                  <form onSubmit={handleUpdateBalance} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="w-full sm:flex-1 space-y-1.5">
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
                      className="w-full sm:w-auto h-8 px-4 rounded-md bg-[#6133e1] hover:bg-[#5229be] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60 shrink-0 shadow-xs"
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

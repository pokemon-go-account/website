"use client";

import { useState, useEffect } from "react";
import { getPendingAuctionListings, approveListingConsole, rejectListingConsole, updateListingConsole, getConcludedAuctions, markAuctionPaymentReceived, markAuctionDelivered } from "@/features/console/actions";
import { Gavel, CheckCircle, XCircle, AlertTriangle, Eye, Edit2, X, Sparkles, Trophy, CalendarDays, Coins, CreditCard, Package, Truck, Clock, Search, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Listing {
  _id: string;
  title: string;
  description: string;
  level: number;
  xp: number;
  stardust: number;
  team: 'MYSTIC' | 'VALOR' | 'INSTINCT' | 'NONE';
  shinyCount: number;
  legendaryCount: number;
  mythicalCount: number;
  region: string;
  screenshots: string[];
  startingBid: number;
  reservePrice: number;
  minIncrement: number;
  durationHours: number;
  status: string;
  adminNotes?: string;
  pokedexCompleted: number;
  bestBuddyCount: number;
  pokeCoins: number;
  startDate: string;
  accountType: string;
  accountStatus: string;
  weeklyDistance: number;
  topPokemon?: string;
  rareCandy: number;
  fastTm: number;
  chargedTm: number;
  eliteFastTm: number;
  eliteChargedTm: number;
  incubators: number;
  luckyEggs: number;
  lureModules: number;
  premiumRaidPass: number;
  createdAt: string;
  sellerId?: { name?: string; username?: string; email?: string };
}

export default function ConsoleAuctionsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "concluded">("pending");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Concluded auctions state
  const [concluded, setConcluded] = useState<any[]>([]);
  const [concludedLoading, setConcludedLoading] = useState(false);
  const [concludedSearch, setConcludedSearch] = useState("");
  const [concludedProcessing, setConcludedProcessing] = useState<string | null>(null);

  // Detail Modal state
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Listing>>({});

  const load = async () => {
    setLoading(true);
    const res = await getPendingAuctionListings();
    if (res.success) setListings(res.listings || []);
    setLoading(false);
  };

  const loadConcluded = async (search = "") => {
    setConcludedLoading(true);
    const res = await getConcludedAuctions(1, 50, search);
    if (res.success) setConcluded(res.auctions || []);
    setConcludedLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (activeTab === "concluded") loadConcluded(concludedSearch); }, [activeTab]);

  const approve = async (id: string, customNotes?: string) => {
    setProcessing(id);
    const res = await approveListingConsole(id, customNotes || notes[id]);
    setMessage({
      text: res.success ? "Listing approved and scheduled for auction." : (res.error || "Failed."),
      success: res.success
    });
    if (res.success) {
      load();
      setSelectedListing(null);
      setIsEditing(false);
    }
    setProcessing(null);
  };

  const reject = async (id: string, customNotes?: string) => {
    const finalNotes = customNotes || notes[id];
    if (!finalNotes?.trim()) {
      setMessage({ text: "Please enter rejection reason before rejecting.", success: false });
      return;
    }
    setProcessing(id);
    const res = await rejectListingConsole(id, finalNotes);
    setMessage({
      text: res.success ? "Listing rejected and seller notified." : (res.error || "Failed."),
      success: res.success
    });
    if (res.success) {
      load();
      setSelectedListing(null);
      setIsEditing(false);
    }
    setProcessing(null);
  };

  const handleEditClick = (listing: Listing) => {
    setSelectedListing(listing);
    setEditForm(listing);
    setIsEditing(true);
  };

  const handleViewClick = (listing: Listing) => {
    setSelectedListing(listing);
    setEditForm(listing);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedListing) return;
    setProcessing(selectedListing._id);
    const res = await updateListingConsole(selectedListing._id, editForm);
    if (res.success) {
      setMessage({ text: "Listing updated successfully.", success: true });
      load();
      // Update selected view
      setSelectedListing({ ...selectedListing, ...editForm } as Listing);
      setIsEditing(false);
    } else {
      setMessage({ text: res.error || "Failed to update listing.", success: false });
    }
    setProcessing(null);
  };

  const handleInputChange = (field: keyof Listing, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-5xl space-y-8">
      {/* Title Header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Auction Management</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Review pending listings and manage concluded auctions.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border border-zinc-200 dark:border-white/[0.06] rounded-lg p-1 bg-zinc-50 dark:bg-white/[0.02] w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={cn(
            "h-8 px-4 rounded-md text-xs font-semibold transition-all cursor-pointer",
            activeTab === "pending"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          <Gavel className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
          Pending Approvals
        </button>
        <button
          onClick={() => setActiveTab("concluded")}
          className={cn(
            "h-8 px-4 rounded-md text-xs font-semibold transition-all cursor-pointer",
            activeTab === "concluded"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          <Trophy className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
          Concluded Auctions
        </button>
      </div>

      {message && (
        <div className={cn(
          "rounded-md border p-3 text-xs flex items-center gap-2",
          message.success 
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" 
            : "border-red-500/20 bg-red-500/5 text-red-650 dark:text-red-400"
        )}>
          {message.success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 text-xs italic">Loading pending submissions...</p>
      ) : listings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.06] py-16 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
          <p className="text-zinc-950 dark:text-white font-semibold text-sm">All Clear</p>
          <p className="text-zinc-550 dark:text-zinc-500 text-xs mt-1">No pending auction listings to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div key={listing._id} className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-4 hover:border-zinc-300 dark:hover:border-white/[0.1] transition-all shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-semibold text-sm">{listing.title}</h3>
                  <p className="text-zinc-500 text-[10px] mt-1.5">
                    By: <span className="text-zinc-700 dark:text-zinc-300 font-semibold">@{listing.sellerId?.username || "Unknown"}</span>
                    {" · "}LVL {listing.level} · Team {listing.team}
                    {" · "}Starting Bid: ${listing.startingBid.toLocaleString()}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-650 text-[10px] mt-0.5">
                    Submitted {new Date(listing.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewClick(listing)}
                    className="h-8 px-3 rounded-md border border-zinc-200 hover:bg-zinc-50 dark:border-white/[0.08] dark:hover:bg-white/[0.05] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Verify details
                  </button>
                  <button
                    onClick={() => handleEditClick(listing)}
                    className="h-8 px-3 rounded-md border border-violet-500/20 hover:border-violet-500/40 bg-violet-600/10 text-violet-650 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400">
                    Pending
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <textarea
                  placeholder="Optional review notes (required for rejection)..."
                  value={notes[listing._id] || ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [listing._id]: e.target.value }))}
                  className="w-full min-h-[50px] p-2.5 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] rounded-md text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors leading-normal resize-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => approve(listing._id)}
                    disabled={processing === listing._id}
                    className="h-8 px-4 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {processing === listing._id ? "Processing..." : "Approve & Go Live"}
                  </button>
                  <button
                    onClick={() => reject(listing._id)}
                    disabled={processing === listing._id}
                    className="h-8 px-4 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================== CONCLUDED TAB ======================== */}
      {activeTab === "concluded" && (
        <div className="space-y-5">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by listing title..."
              value={concludedSearch}
              onChange={(e) => setConcludedSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") loadConcluded(concludedSearch); }}
              className="w-full h-9 pl-9 pr-20 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] rounded-lg text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
            />
            <button
              onClick={() => loadConcluded(concludedSearch)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2.5 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-semibold cursor-pointer"
            >Search</button>
          </div>

          {concludedLoading ? (
            <p className="text-zinc-500 text-xs italic">Loading concluded auctions...</p>
          ) : concluded.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.06] py-16 text-center">
              <Trophy className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
              <p className="text-zinc-950 dark:text-white font-semibold text-sm">No Concluded Auctions</p>
              <p className="text-zinc-500 text-xs mt-1">Auctions that have ended will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {concluded.map((a) => {
                const order = a.associatedOrder;
                const buyMethod = a.buyNowBuyerId ? "BUY_NOW" : "AUCTION_BID";
                const buyer = a.buyNowBuyerId ? a.buyNowBuyerId : a.highestBidderId;
                const buyerName = a.buyNowBuyerName || buyer?.username || buyer?.name || "Unknown";
                const deliveryStatus: string = order?.deliveryStatus || "PENDING";

                const deliveryConfig: Record<string, { label: string; className: string; icon: any }> = {
                  PENDING: { label: "Awaiting Payment", className: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
                  PAYMENT_RECEIVED: { label: "Payment Received", className: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20", icon: CreditCard },
                  DELIVERED: { label: "Delivered", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Truck },
                };
                const dConfig = deliveryConfig[deliveryStatus] || deliveryConfig.PENDING;
                const DIcon = dConfig.icon;

                return (
                  <div key={a._id} className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-zinc-900 dark:text-white font-semibold text-sm truncate max-w-xs">
                            {a.listingId?.title || "Unnamed Listing"}
                          </h3>
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                            buyMethod === "BUY_NOW"
                              ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
                              : "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20"
                          )}>
                            {buyMethod === "BUY_NOW" ? "Buy Now" : "Auction Bid"}
                          </span>
                          <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border", dConfig.className)}>
                            <DIcon className="h-3 w-3 inline-block mr-1 -mt-0.5" />
                            {dConfig.label}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-[10px]">
                          {buyMethod === "BUY_NOW" ? (
                            <>🛒 Bought via Buy Now by <strong className="text-zinc-700 dark:text-zinc-300">@{buyerName}</strong></>
                          ) : (
                            <>🏆 Won by <strong className="text-zinc-700 dark:text-zinc-300">@{buyerName}</strong></>
                          )}
                          {" · "}
                          Final price: <strong className="text-zinc-700 dark:text-zinc-300">${a.currentHighestBid?.toLocaleString()}</strong>
                          {" · "}
                          {new Date(a.updatedAt || a.endTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        {buyer?.email && (
                          <p className="text-zinc-400 text-[10px]">
                            <User className="h-3 w-3 inline-block mr-1" />
                            {buyer.email}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      {order ? (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {deliveryStatus === "PENDING" && (
                            <button
                              onClick={async () => {
                                setConcludedProcessing(order._id);
                                const res = await markAuctionPaymentReceived(order._id);
                                if (res.success) loadConcluded(concludedSearch);
                                else alert(res.error || "Failed.");
                                setConcludedProcessing(null);
                              }}
                              disabled={concludedProcessing === order._id}
                              className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              {concludedProcessing === order._id ? "..." : "Mark Payment Received"}
                            </button>
                          )}
                          {deliveryStatus === "PAYMENT_RECEIVED" && (
                            <button
                              onClick={async () => {
                                setConcludedProcessing(order._id);
                                const res = await markAuctionDelivered(order._id);
                                if (res.success) loadConcluded(concludedSearch);
                                else alert(res.error || "Failed.");
                                setConcludedProcessing(null);
                              }}
                              disabled={concludedProcessing === order._id}
                              className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              {concludedProcessing === order._id ? "..." : "Mark Delivered"}
                            </button>
                          )}
                          {deliveryStatus === "DELIVERED" && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Delivered — Feedback Unlocked
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold border border-amber-500/20 bg-amber-500/5 px-2 py-1 rounded-md">
                          ⏳ No order yet — winner has not paid
                        </span>
                      )}
                    </div>

                    {order && (
                      <div className="border-t border-zinc-100 dark:border-white/[0.04] pt-3 flex flex-wrap gap-4 text-[10px] text-zinc-500">
                        <span>Order ID: <span className="font-mono text-zinc-700 dark:text-zinc-300">{order._id.substring(0, 16)}…</span></span>
                        <span>Paid: <strong className="text-zinc-700 dark:text-zinc-300">${order.totalPrice?.toFixed(2)}</strong></span>
                        {order.walletDiscountApplied > 0 && (
                          <span>Wallet Used: <strong className="text-emerald-600">−${order.walletDiscountApplied?.toFixed(2)}</strong></span>
                        )}
                        <span>Type: <strong className="text-zinc-700 dark:text-zinc-300">{order.orderType}</strong></span>
                        <span>Status: <strong className={order.status === "COMPLETED" ? "text-emerald-600" : "text-amber-500"}>{order.status}</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Verification / Details Modal (pending tab only) */}
      {activeTab === "pending" && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto transition-colors duration-300">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-200 dark:border-white/[0.05] pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  {isEditing ? "Editing Asset Coordinates" : "Verifying Asset Coordinates"}
                </span>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white mt-1">
                  {isEditing ? `Edit: ${selectedListing.title}` : selectedListing.title}
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Submitted by @{selectedListing.sellerId?.username || "Unknown"} · {selectedListing.sellerId?.email}
                </p>
              </div>
              <button
                onClick={() => { setSelectedListing(null); setIsEditing(false); }}
                className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            {isEditing ? (
              /* Editable Form Mode */
              <div className="space-y-6 text-xs text-zinc-700 dark:text-zinc-300">
                {/* section: Core info */}
                <div className="space-y-3">
                  <h4 className="font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider text-[10px]">Core Telemetry</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Listing Title</label>
                      <input
                        type="text"
                        value={editForm.title || ""}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white focus:border-zinc-400 dark:focus:border-white outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-zinc-500 font-medium">Trainer Level</label>
                        <input
                          type="number"
                          value={editForm.level || 0}
                          onChange={(e) => handleInputChange("level", parseInt(e.target.value))}
                          className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white focus:border-zinc-400 dark:focus:border-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-zinc-500 font-medium">Team faction</label>
                        <select
                          value={editForm.team || "NONE"}
                          onChange={(e) => handleInputChange("team", e.target.value)}
                          className="w-full h-8 px-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white outline-none cursor-pointer"
                        >
                          <option value="NONE">None</option>
                          <option value="MYSTIC">Mystic</option>
                          <option value="VALOR">Valor</option>
                          <option value="INSTINCT">Instinct</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-medium">Description</label>
                    <textarea
                      value={editForm.description || ""}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="w-full min-h-[60px] p-2.5 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] rounded-lg text-zinc-950 dark:text-white focus:border-zinc-400 dark:focus:border-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* section: Pricing Economics */}
                <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-white/[0.05]">
                  <h4 className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[10px]">Auction Economics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Starting Bid ($)</label>
                      <input
                        type="number"
                        value={editForm.startingBid || 0}
                        onChange={(e) => handleInputChange("startingBid", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Reserve Price ($)</label>
                      <input
                        type="number"
                        value={editForm.reservePrice || 0}
                        onChange={(e) => handleInputChange("reservePrice", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Min Increment ($)</label>
                      <input
                        type="number"
                        value={editForm.minIncrement || 0}
                        onChange={(e) => handleInputChange("minIncrement", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Duration (Hours)</label>
                      <input
                        type="number"
                        value={editForm.durationHours || 0}
                        onChange={(e) => handleInputChange("durationHours", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* section: Metrics telemetry */}
                <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-white/[0.05]">
                  <h4 className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">Account Telemetry & Resources</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Stardust</label>
                      <input
                        type="number"
                        value={editForm.stardust || 0}
                        onChange={(e) => handleInputChange("stardust", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Total XP</label>
                      <input
                        type="number"
                        value={editForm.xp || 0}
                        onChange={(e) => handleInputChange("xp", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Region</label>
                      <input
                        type="text"
                        value={editForm.region || ""}
                        onChange={(e) => handleInputChange("region", e.target.value)}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Shiny Count</label>
                      <input
                        type="number"
                        value={editForm.shinyCount || 0}
                        onChange={(e) => handleInputChange("shinyCount", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Legendary Count</label>
                      <input
                        type="number"
                        value={editForm.legendaryCount || 0}
                        onChange={(e) => handleInputChange("legendaryCount", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Mythical Count</label>
                      <input
                        type="number"
                        value={editForm.mythicalCount || 0}
                        onChange={(e) => handleInputChange("mythicalCount", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Pokedex Completed %</label>
                      <input
                        type="number"
                        value={editForm.pokedexCompleted || 0}
                        onChange={(e) => handleInputChange("pokedexCompleted", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">PokeCoins Balance</label>
                      <input
                        type="number"
                        value={editForm.pokeCoins || 0}
                        onChange={(e) => handleInputChange("pokeCoins", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Best Buddy Count</label>
                      <input
                        type="number"
                        value={editForm.bestBuddyCount || 0}
                        onChange={(e) => handleInputChange("bestBuddyCount", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Account Standing</label>
                      <input
                        type="text"
                        value={editForm.accountStatus || ""}
                        onChange={(e) => handleInputChange("accountStatus", e.target.value)}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Link Type</label>
                      <input
                        type="text"
                        value={editForm.accountType || ""}
                        onChange={(e) => handleInputChange("accountType", e.target.value)}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Weekly Distance (km)</label>
                      <input
                        type="number"
                        value={editForm.weeklyDistance || 0}
                        onChange={(e) => handleInputChange("weeklyDistance", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* section: inventory items */}
                <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-white/[0.05]">
                  <h4 className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px]">Inventory Items</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Rare Candy</label>
                      <input
                        type="number"
                        value={editForm.rareCandy || 0}
                        onChange={(e) => handleInputChange("rareCandy", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Fast TM</label>
                      <input
                        type="number"
                        value={editForm.fastTm || 0}
                        onChange={(e) => handleInputChange("fastTm", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Charged TM</label>
                      <input
                        type="number"
                        value={editForm.chargedTm || 0}
                        onChange={(e) => handleInputChange("chargedTm", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Elite Fast</label>
                      <input
                        type="number"
                        value={editForm.eliteFastTm || 0}
                        onChange={(e) => handleInputChange("eliteFastTm", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Elite Charged</label>
                      <input
                        type="number"
                        value={editForm.eliteChargedTm || 0}
                        onChange={(e) => handleInputChange("eliteChargedTm", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Incubators</label>
                      <input
                        type="number"
                        value={editForm.incubators || 0}
                        onChange={(e) => handleInputChange("incubators", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-950 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* actions footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-white/[0.05]">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={processing === selectedListing._id}
                    className="h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              /* Detail View Mode */
              <div className="space-y-6 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: General Stats & Telemetry */}
                  <div className="md:col-span-2 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.05] rounded-xl p-3">
                        <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Stardust</span>
                        <span className="text-zinc-900 dark:text-white text-sm font-bold mt-1 block">{selectedListing.stardust.toLocaleString()}</span>
                      </div>
                      <div className="bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.05] rounded-xl p-3">
                        <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Total XP</span>
                        <span className="text-zinc-900 dark:text-white text-sm font-bold mt-1 block">{selectedListing.xp.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.05] rounded-xl p-3 text-center">
                        <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Shiny</span>
                        <span className="text-yellow-600 dark:text-yellow-500 text-sm font-black mt-1 block">{selectedListing.shinyCount}✨</span>
                      </div>
                      <div className="bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.05] rounded-xl p-3 text-center">
                        <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Legendary</span>
                        <span className="text-orange-600 dark:text-orange-500 text-sm font-black mt-1 block">{selectedListing.legendaryCount}🏆</span>
                      </div>
                      <div className="bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.05] rounded-xl p-3 text-center">
                        <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Mythical</span>
                        <span className="text-purple-600 dark:text-purple-500 text-sm font-black mt-1 block">{selectedListing.mythicalCount}🔮</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-zinc-500 dark:text-zinc-400 font-bold block">Top Pokémon Highlights</span>
                      <p className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] rounded-xl p-3 text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono">
                        {selectedListing.topPokemon || "None listed"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-zinc-500 dark:text-zinc-400 font-bold block">Description Details</span>
                      <p className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] rounded-xl p-3 text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                        {selectedListing.description}
                      </p>
                    </div>

                    {/* Screenshot Gallery */}
                    {selectedListing.screenshots && selectedListing.screenshots.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-zinc-500 dark:text-zinc-400 font-bold block">Uploaded Gallery Screenshots</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {selectedListing.screenshots.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-450 dark:hover:border-white/30 transition-all bg-zinc-100 dark:bg-zinc-900 group relative"
                            >
                              <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-all">
                                Open Fullscreen
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Technical Telemetry & Pricing */}
                  <div className="space-y-5 bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.05] rounded-xl p-4 h-fit">
                    <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-white/[0.05] pb-2">Technical Telemetry</h4>
                    <div className="space-y-2.5 text-[11px]">
                      <div className="flex justify-between"><span className="text-zinc-500">Faction Team:</span><span className="text-zinc-900 dark:text-white font-semibold">{selectedListing.team}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Region Coverage:</span><span className="text-zinc-900 dark:text-white font-semibold">{selectedListing.region}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Pokedex Completed:</span><span className="text-zinc-900 dark:text-white font-semibold">{selectedListing.pokedexCompleted}%</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">PokeCoins:</span><span className="text-zinc-900 dark:text-white font-semibold">{selectedListing.pokeCoins}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Best Buddies:</span><span className="text-zinc-900 dark:text-white font-semibold">{selectedListing.bestBuddyCount}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Link Method:</span><span className="text-zinc-900 dark:text-white font-semibold">{selectedListing.accountType}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Account Health:</span><span className="text-emerald-600 dark:text-emerald-400 font-semibold">{selectedListing.accountStatus}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Registration Date:</span><span className="text-zinc-900 dark:text-white font-semibold">{selectedListing.startDate}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Weekly Distance:</span><span className="text-zinc-900 dark:text-white font-semibold">{selectedListing.weeklyDistance} km</span></div>
                    </div>

                    <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-white/[0.05] pt-3 pb-2">Inventory Ledger</h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-550 block">Rare Candy</span><span className="text-zinc-900 dark:text-white font-bold">{selectedListing.rareCandy}</span></div>
                      <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-550 block">Fast TM</span><span className="text-zinc-900 dark:text-white font-bold">{selectedListing.fastTm}</span></div>
                      <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-550 block">Charged</span><span className="text-zinc-900 dark:text-white font-bold">{selectedListing.chargedTm}</span></div>
                      <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-550 block">Elite Fast</span><span className="text-zinc-900 dark:text-white font-bold">{selectedListing.eliteFastTm}</span></div>
                      <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-550 block">Elite Chg</span><span className="text-zinc-900 dark:text-white font-bold">{selectedListing.eliteChargedTm}</span></div>
                      <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-550 block">Incubator</span><span className="text-zinc-900 dark:text-white font-bold">{selectedListing.incubators}</span></div>
                    </div>

                    <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-white/[0.05] pt-3 pb-2">Bidding Economics</h4>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between"><span className="text-zinc-500">Starting Price:</span><span className="text-zinc-900 dark:text-white font-bold">${selectedListing.startingBid.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Reserve Price:</span><span className="text-zinc-900 dark:text-white font-bold">${selectedListing.reservePrice.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Min Increment:</span><span className="text-zinc-900 dark:text-white font-semibold">${selectedListing.minIncrement.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Auction Window:</span><span className="text-zinc-900 dark:text-white font-semibold">{selectedListing.durationHours} Hours</span></div>
                    </div>
                  </div>
                </div>

                {/* Review note area */}
                <div className="space-y-3 pt-6 border-t border-zinc-200 dark:border-white/[0.05]">
                  <label className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[10px] block">Review Action Comments</label>
                  <textarea
                    placeholder="Provide review context, feedback notes or rejection reasons..."
                    value={notes[selectedListing._id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [selectedListing._id]: e.target.value }))}
                    className="w-full min-h-[70px] p-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] rounded-xl text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors leading-normal"
                  />
                </div>

                {/* Action Row */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-zinc-200 dark:border-white/[0.05]">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="h-9 px-4 rounded-xl border border-violet-500/20 hover:border-violet-500/40 bg-violet-600/10 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Metrics
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => reject(selectedListing._id)}
                      disabled={processing === selectedListing._id}
                      className="h-9 px-4 rounded-xl bg-red-655 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => approve(selectedListing._id)}
                      disabled={processing === selectedListing._id}
                      className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve & Run Auction
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

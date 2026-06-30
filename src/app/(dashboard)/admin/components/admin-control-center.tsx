"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  Activity,
  GitCommit,
  UserX,
  Terminal,
  Clock,
  Sparkles,
  Trophy,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  AlertTriangle,
  FileKey,
  Unlock,
  Coins,
  ShieldAlert as AlertCircle
} from "lucide-react";
import {
  approveListing,
  rejectListing,
  pauseAuction,
  resumeAuction,
  forceEndAuction,
  rollbackAuctionBid,
  updateEscrowStage,
  saveListingCredentials,
  releaseEscrowFunds,
  triggerForfeitCascade,
  manualSyncRegistration,
  getWebhookLogs
} from "@/features/admin/actions";

interface AdminControlCenterProps {
  initialLogs: any[];
  initialActiveAuctions: any[];
  initialConcludedAuctions: any[];
  initialPendingListings: any[];
  initialEscrowListings: any[];
  totalUsers: number;
  pendingCount: number;
}

export function AdminControlCenter({
  initialLogs,
  initialActiveAuctions,
  initialConcludedAuctions,
  initialPendingListings,
  initialEscrowListings,
  totalUsers,
  pendingCount
}: AdminControlCenterProps) {
  const [activeTab, setActiveTab] = useState<"auditor" | "killswitch" | "escrow" | "cascade" | "webhook">("auditor");
  const [pendingListings, setPendingListings] = useState(initialPendingListings);
  const [activeAuctions, setActiveAuctions] = useState(initialActiveAuctions);
  const [concludedAuctions, setConcludedAuctions] = useState(initialConcludedAuctions);
  const [escrowListings, setEscrowListings] = useState(initialEscrowListings);
  const [webhookLogs, setWebhookLogs] = useState(initialLogs);
  const [isPending, setIsPending] = useState(false);

  // Auditor Tab State
  const [selectedPending, setSelectedPending] = useState<any | null>(initialPendingListings[0] || null);
  const [auditTitle, setAuditTitle] = useState("");
  const [auditLevel, setAuditLevel] = useState(0);
  const [auditStardust, setAuditStardust] = useState(0);
  const [auditShiny, setAuditShiny] = useState(0);
  const [auditLegendary, setAuditLegendary] = useState(0);
  const [auditMythical, setAuditMythical] = useState(0);
  const [auditTeam, setAuditTeam] = useState<any>("NONE");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Escrow Vault State
  const [vaultTexts, setVaultTexts] = useState<Record<string, string>>({});
  
  // Watchdog State
  const [manualOrderId, setManualOrderId] = useState("");

  // Populate audit form when selecting a listing
  const selectListingForAudit = (listing: any) => {
    setSelectedPending(listing);
    setAuditTitle(listing.title);
    setAuditLevel(listing.level);
    setAuditStardust(listing.stardust);
    setAuditShiny(listing.shinyCount);
    setAuditLegendary(listing.legendaryCount);
    setAuditMythical(listing.mythicalCount);
    setAuditTeam(listing.team);
    setActiveImageIndex(0);
  };

  // Sync / Refresh logs list
  const refreshTelemetryLogs = async () => {
    setIsPending(true);
    const res = await getWebhookLogs();
    if (res.success && res.logs) {
      setWebhookLogs(res.logs);
    }
    setIsPending(false);
  };

  // 1. Audit Approve with inline overwrites
  const handleAuditApprove = async () => {
    if (!selectedPending) return;
    setIsPending(true);
    const res = await approveListing(selectedPending._id, {
      title: auditTitle,
      level: Number(auditLevel),
      stardust: Number(auditStardust),
      shinyCount: Number(auditShiny),
      legendaryCount: Number(auditLegendary),
      mythicalCount: Number(auditMythical),
      team: auditTeam,
    });

    if (res.success) {
      alert("Listing approved and live bidding block scheduled successfully!");
      window.location.reload();
    } else {
      alert(res.error || "Failed to approve listing.");
    }
    setIsPending(false);
  };

  // Audit Reject
  const handleAuditReject = async () => {
    if (!selectedPending) return;
    const notes = prompt("Enter listing rejection feedback comments:");
    if (!notes) return;

    setIsPending(true);
    const res = await rejectListing(selectedPending._id, notes);
    if (res.success) {
      alert("Listing rejected successfully.");
      window.location.reload();
    } else {
      alert(res.error || "Failed to reject listing.");
    }
    setIsPending(false);
  };

  // 2. Kill switch triggers
  const handlePause = async (id: string) => {
    const res = await pauseAuction(id);
    if (res.success) {
      alert("Bidding successfully frozen!");
      window.location.reload();
    } else alert(res.error);
  };

  const handleResume = async (id: string) => {
    const res = await resumeAuction(id);
    if (res.success) {
      alert("Bidding resumed!");
      window.location.reload();
    } else alert(res.error);
  };

  const handleForceEnd = async (id: string) => {
    if (!confirm("Are you sure you want to force end this auction block immediately?")) return;
    const res = await forceEndAuction(id);
    if (res.success) {
      alert("Auction clock cut to zero!");
      window.location.reload();
    } else alert(res.error);
  };

  const handleRollback = async (id: string) => {
    if (!confirm("Rollback highest bid? This deletes the top bid and restores the previous high bidder status.")) return;
    const res = await rollbackAuctionBid(id);
    if (res.success) {
      alert("Bid successfully rolled back!");
      window.location.reload();
    } else alert(res.error);
  };

  // 3. Escrow triggers
  const handleStageChange = async (id: string, stage: string) => {
    const res = await updateEscrowStage(id, stage);
    if (res.success) {
      alert(`Escrow transitioned to: ${stage}`);
      window.location.reload();
    } else alert(res.error);
  };

  const handleSaveCredentials = async (id: string) => {
    const text = vaultTexts[id];
    if (text === undefined) return;
    const res = await saveListingCredentials(id, text);
    if (res.success) {
      alert("Credentials Vault updated!");
    } else alert(res.error);
  };

  const handleReleaseFunds = async (id: string) => {
    if (!confirm("Authorize payout release switch? This confirms split balance payouts to the seller.")) return;
    const res = await releaseEscrowFunds(id);
    if (res.success) {
      alert("Payout funds released!");
      window.location.reload();
    } else alert(res.error);
  };

  // 4. Cascade triggers
  const handleCascadeForfeit = async (aucId: string) => {
    if (!confirm("Execute forfeit and suspend winner? This forfeits the deposit, suspends the winner profile, and cascades bidding to runner-up.")) return;
    setIsPending(true);
    const res = await triggerForfeitCascade(aucId);
    if (res.success) {
      alert("Cascade transaction complete! Secondary runner-up bidder notified and payment timeline extended 24h.");
      window.location.reload();
    } else {
      alert(res.error);
    }
    setIsPending(false);
  };

  // 5. Watchdog triggers
  const handleManualSync = async () => {
    if (!manualOrderId) return;
    setIsPending(true);
    const res = await manualSyncRegistration(manualOrderId);
    if (res.success) {
      alert("Registration force synchronized to PAID status!");
      setManualOrderId("");
      refreshTelemetryLogs();
    } else {
      alert(res.error);
    }
    setIsPending(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Tab Navigation Row */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        <button
          onClick={() => {
            setActiveTab("auditor");
            if (pendingListings[0]) selectListingForAudit(pendingListings[0]);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border",
            activeTab === "auditor"
              ? "bg-zinc-900 border-zinc-700 text-white"
              : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ShieldAlert className="h-4 w-4" />
          Review Auditor
        </button>
        <button
          onClick={() => setActiveTab("killswitch")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border",
            activeTab === "killswitch"
              ? "bg-zinc-900 border-zinc-700 text-white"
              : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Activity className="h-4 w-4" />
          Live Kill Switch
        </button>
        <button
          onClick={() => setActiveTab("escrow")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border",
            activeTab === "escrow"
              ? "bg-zinc-900 border-zinc-700 text-white"
              : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <GitCommit className="h-4 w-4" />
          Escrow Pipeline
        </button>
        <button
          onClick={() => setActiveTab("cascade")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border",
            activeTab === "cascade"
              ? "bg-zinc-900 border-zinc-700 text-white"
              : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <UserX className="h-4 w-4" />
          Forfeit Ledger
        </button>
        <button
          onClick={() => setActiveTab("webhook")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border",
            activeTab === "webhook"
              ? "bg-zinc-900 border-zinc-700 text-white"
              : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Terminal className="h-4 w-4" />
          Webhook Watchdog
        </button>
      </div>

      {/* Tab Panels */}

      {/* Tab 1: Review Auditor (Metadata Discrepancy & Screenshot Auditor) */}
      {activeTab === "auditor" && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Sidebar list of pending */}
            <div className="lg:col-span-1 border border-border rounded-xl p-4 bg-card/20 space-y-3 h-fit max-h-[600px] overflow-y-auto">
              <h3 className="font-bold text-sm text-foreground">Pending Submissions</h3>
              {pendingListings.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No submissions pending moderation.</p>
              ) : (
                pendingListings.map((l: any) => (
                  <button
                    key={l._id}
                    onClick={() => selectListingForAudit(l)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer",
                      selectedPending?._id === l._id
                        ? "border-primary/50 bg-primary/5 text-foreground"
                        : "border-border/60 hover:bg-muted/10 text-muted-foreground"
                    )}
                  >
                    <div className="font-semibold text-foreground truncate">{l.title}</div>
                    <div className="text-[10px] mt-1 flex justify-between">
                      <span>Lvl {l.level} • {l.team}</span>
                      <span>₹{l.startingBid}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Audit Dual Pane */}
            {selectedPending ? (
              <div className="lg:col-span-2 grid md:grid-cols-2 gap-6 border border-border rounded-xl p-6 bg-card/35 backdrop-blur-sm">
                
                {/* Left Pane: Inline Overwrite Form */}
                <div className="space-y-4">
                  <div className="border-b border-border pb-3">
                    <h3 className="font-bold text-base text-foreground">Inline Metric Auditor</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Correct details inline before verification approval.</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">Title Coordinate</label>
                      <input
                        type="text"
                        value={auditTitle}
                        onChange={(e) => setAuditTitle(e.target.value)}
                        className="w-full h-8 px-3 bg-muted/40 border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground">Level</label>
                        <input
                          type="number"
                          value={auditLevel}
                          onChange={(e) => setAuditLevel(Number(e.target.value))}
                          className="w-full h-8 px-3 bg-muted/40 border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground">Stardust</label>
                        <input
                          type="number"
                          value={auditStardust}
                          onChange={(e) => setAuditStardust(Number(e.target.value))}
                          className="w-full h-8 px-3 bg-muted/40 border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground">Shiny ✨</label>
                        <input
                          type="number"
                          value={auditShiny}
                          onChange={(e) => setAuditShiny(Number(e.target.value))}
                          className="w-full h-8 px-3 bg-muted/40 border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground">Legendary 🏆</label>
                        <input
                          type="number"
                          value={auditLegendary}
                          onChange={(e) => setAuditLegendary(Number(e.target.value))}
                          className="w-full h-8 px-3 bg-muted/40 border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground">Mythical 🔮</label>
                        <input
                          type="number"
                          value={auditMythical}
                          onChange={(e) => setAuditMythical(Number(e.target.value))}
                          className="w-full h-8 px-3 bg-muted/40 border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">Trainer Team</label>
                      <select
                        value={auditTeam}
                        onChange={(e) => setAuditTeam(e.target.value as any)}
                        className="w-full h-8 px-2 bg-muted/40 border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="MYSTIC">MYSTIC (Blue)</option>
                        <option value="VALOR">VALOR (Red)</option>
                        <option value="INSTINCT">INSTINCT (Yellow)</option>
                        <option value="NONE">NONE</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <button
                      onClick={handleAuditApprove}
                      disabled={isPending}
                      className="flex-1 h-9 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4" /> Verify Approve
                    </button>
                    <button
                      onClick={handleAuditReject}
                      disabled={isPending}
                      className="h-9 px-4 rounded border border-border hover:bg-muted text-muted-foreground font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4 text-red-500" /> Reject
                    </button>
                  </div>
                </div>

                {/* Right Pane: Screenshot auditor */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="border-b border-border pb-3">
                    <h3 className="font-bold text-sm text-foreground">Visual Asset Proofs</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Validate account metrics against uploaded screen caps.</p>
                  </div>

                  <div className="relative flex-grow flex items-center justify-center bg-zinc-950/60 rounded-lg border border-border/80 h-[220px] overflow-hidden">
                    {selectedPending.screenshots && selectedPending.screenshots.length > 0 ? (
                      <>
                        <img
                          src={selectedPending.screenshots[activeImageIndex]}
                          alt="Screenshot Proof"
                          className="max-h-full max-w-full object-contain"
                        />

                        {selectedPending.screenshots.length > 1 && (
                          <div className="absolute inset-x-2 bottom-2 flex justify-between items-center px-2">
                            <button
                              onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedPending.screenshots.length - 1))}
                              className="h-7 w-7 rounded bg-black/80 hover:bg-black text-white flex items-center justify-center border border-zinc-700 cursor-pointer"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-[9px] bg-black/80 px-2 py-0.5 rounded border border-zinc-700 text-white">
                              {activeImageIndex + 1} / {selectedPending.screenshots.length}
                            </span>
                            <button
                              onClick={() => setActiveImageIndex((prev) => (prev < selectedPending.screenshots.length - 1 ? prev + 1 : 0))}
                              className="h-7 w-7 rounded bg-black/80 hover:bg-black text-white flex items-center justify-center border border-zinc-700 cursor-pointer"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-4 space-y-1">
                        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
                        <h4 className="text-xs font-semibold text-zinc-300">No screen captures uploaded</h4>
                        <p className="text-[10px] text-zinc-500">Seller did not upload verification screenshots.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-[10px] text-muted-foreground leading-normal bg-muted/20 border border-border p-2.5 rounded space-y-1">
                    <div><strong>Seller Contact:</strong> {selectedPending.sellerId?.name} ({selectedPending.sellerId?.email})</div>
                    <div><strong>Telegram (Listing):</strong> <span className="text-zinc-300 font-semibold">{selectedPending.telegramUsername ? `@${selectedPending.telegramUsername.replace("@", "")}` : "Not configured"}</span></div>
                    <div><strong>Telegram (Profile):</strong> <span className="text-zinc-300 font-semibold">{selectedPending.sellerId?.telegramUsername ? `@${selectedPending.sellerId.telegramUsername.replace("@", "")}` : "Not configured"}</span></div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="lg:col-span-2 flex h-[350px] items-center justify-center border border-border rounded-xl bg-card/10 italic text-muted-foreground text-xs">
                Select a listing on the left to begin audit review.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Live Room Kill Switch */}
      {activeTab === "killswitch" && (
        <div className="space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-lg font-bold text-foreground">Live Auction Control Row (Kill Switch)</h2>
            <p className="text-xs text-muted-foreground">Emergency administrative controls over Socket.IO state events.</p>
          </div>

          {activeAuctions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6">No active auctions running currently.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeAuctions.map((auc) => (
                <div key={auc._id} className="border border-border bg-card/25 p-5 rounded-xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">{auc.listingId?.title}</h4>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Current Highest: <strong className="text-foreground">₹{auc.currentHighestBid.toLocaleString()}</strong>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold border",
                      auc.status === "PAUSED" ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse" : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {auc.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground py-2 border-y border-border/50">
                    <div>End Clock: {new Date(auc.endTime).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="text-right">Increment: ₹{auc.listingId?.minIncrement}</div>
                  </div>

                  {/* Operational Controls */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {auc.status === "PAUSED" ? (
                      <button
                        onClick={() => handleResume(auc._id)}
                        className="h-8 rounded bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Play className="h-3 w-3 text-emerald-500" /> Resume Bidding
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePause(auc._id)}
                        className="h-8 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Pause className="h-3 w-3" /> Pause Bidding
                      </button>
                    )}
                    <button
                      onClick={() => handleRollback(auc._id)}
                      className="h-8 rounded border border-border hover:bg-muted text-muted-foreground font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Rollback Bid
                    </button>
                    <button
                      onClick={() => handleForceEnd(auc._id)}
                      className="col-span-2 h-8 rounded bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle className="h-3 w-3" /> Force End Auction (Cut Clock)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Escrow Pipeline */}
      {activeTab === "escrow" && (
        <div className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-lg font-bold text-foreground">Intermediated Escrow & Payout Board</h2>
            <p className="text-xs text-muted-foreground">Manage credentials verification flow and process splits payout.</p>
          </div>

          {escrowListings.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6">No verified escrow listings active currently.</p>
          ) : (
            <div className="grid gap-6">
              {escrowListings.map((l) => (
                <div key={l._id} className="border border-border bg-card/25 p-6 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{l.title}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-muted-foreground">
                        <p>Seller Telegram: <strong className="text-zinc-300">@{l.telegramUsername}</strong></p>
                        {(() => {
                          const auc = 
                            activeAuctions.find((a) => a.listingId?._id === l._id) ||
                            concludedAuctions.find((a) => a.listingId?._id === l._id);
                          if (auc && auc.highestBidderId) {
                            return (
                              <p>Buyer Telegram: <strong className="text-zinc-300">@{auc.highestBidderId.telegramUsername || "None configured"}</strong></p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Stage:</span>
                      <select
                        value={l.escrowStage || "APPROVED"}
                        onChange={(e) => handleStageChange(l._id, e.target.value)}
                        className="h-7 px-2 bg-muted border border-border rounded text-[10px] text-foreground cursor-pointer focus:outline-none focus:border-primary"
                      >
                        <option value="APPROVED">Approved</option>
                        <option value="LIVE">Live</option>
                        <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                        <option value="CREDENTIALS_SECURED">Credentials Secured</option>
                        <option value="CREDENTIALS_DELIVERED">Credentials Delivered</option>
                        <option value="FUNDS_RELEASED">Funds Released</option>
                      </select>
                    </div>
                  </div>

                  {/* Credentials Vault Field */}
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <FileKey className="h-3.5 w-3.5 text-yellow-500" />
                        Secure Credentials Vault
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          placeholder="Enter account credentials received from seller (e.g. login, password, recovery token)..."
                          value={vaultTexts[l._id] !== undefined ? vaultTexts[l._id] : l.credentialsVault || ""}
                          onChange={(e) => setVaultTexts({ ...vaultTexts, [l._id]: e.target.value })}
                          className="flex-grow min-h-[60px] p-2 bg-zinc-950/60 border border-border rounded text-[11px] placeholder:text-zinc-600 focus:outline-none text-foreground focus:border-zinc-700 leading-normal"
                        />
                        <button
                          onClick={() => handleSaveCredentials(l._id)}
                          className="h-fit py-2 px-3 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[10px] border border-zinc-700/50 cursor-pointer self-end"
                        >
                          Save Vault
                        </button>
                      </div>
                    </div>

                    {/* Payout actions */}
                    <div className="border border-border/80 bg-zinc-950/20 p-4 rounded-lg flex flex-col justify-between">
                      <div className="space-y-1">
                        <h5 className="text-xs font-semibold text-zinc-300">Financial Split Authorization</h5>
                        <p className="text-[10px] text-zinc-500 leading-normal">
                          Upon buyer confirming delivery, authorize final platform splits (₹199 admin escrow split release).
                        </p>
                      </div>

                      {l.escrowStage === "CREDENTIALS_DELIVERED" ? (
                        <button
                          onClick={() => handleReleaseFunds(l._id)}
                          className="mt-3 w-full h-8 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Unlock className="h-3.5 w-3.5" /> Authorize Payout Split
                        </button>
                      ) : l.escrowStage === "FUNDS_RELEASED" ? (
                        <div className="mt-3 flex items-center justify-center gap-1.5 text-emerald-500 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 py-1.5 rounded">
                          <CheckCircle className="h-3.5 w-3.5" /> Funds Released to Seller
                        </div>
                      ) : (
                        <div className="mt-3 text-zinc-500 text-[10px] italic bg-muted/40 py-1.5 rounded text-center border border-border">
                          Payout switch unlocks in "Credentials Delivered" stage
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Forfeit & Cascade Ledger */}
      {activeTab === "cascade" && (
        <div className="space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-lg font-bold text-foreground">Forfeit & Runner-Up Cascade Engine</h2>
            <p className="text-xs text-muted-foreground">Manage payment defaults, suspend winners, and cascade to secondary bidders.</p>
          </div>

          {initialConcludedAuctions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6">No concluded auctions detected.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card/20">
              <table className="min-w-full divide-y divide-border text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Auction Block</th>
                    <th className="px-6 py-4">Winner Details</th>
                    <th className="px-6 py-4">Final Bid</th>
                    <th className="px-6 py-4 text-right">Cascade Execution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {initialConcludedAuctions.map((auc) => (
                    <tr key={auc._id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{auc.listingId?.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Concluded Date: {new Date(auc.endTime).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        {auc.highestBidderId ? (
                          <div className="space-y-0.5">
                            <div className="font-medium text-foreground">{auc.highestBidderId.name}</div>
                            <div className="text-[10px] text-muted-foreground">{auc.highestBidderId.email}</div>
                            <div className="text-[10px] text-zinc-300">
                              Telegram: <strong className="font-semibold text-white">
                                {auc.highestBidderId.telegramUsername 
                                  ? `@${auc.highestBidderId.telegramUsername.replace("@", "")}` 
                                  : "Not configured"}
                              </strong>
                            </div>
                            {auc.highestBidderId.isSuspended && (
                              <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded text-[9px] font-bold border border-red-500/20">
                                Suspended
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic">No bidder participated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        ₹{auc.currentHighestBid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {auc.highestBidderId ? (
                          <button
                            onClick={() => handleCascadeForfeit(auc._id)}
                            disabled={isPending || auc.highestBidderId.isSuspended}
                            className="h-8 px-4 rounded bg-red-950 hover:bg-red-900 border border-red-800 disabled:opacity-50 text-red-200 font-semibold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                          >
                            <UserX className="h-3.5 w-3.5" /> Forfeit & Cascade Runner-Up
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-500 italic">Cascade not applicable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Webhook Watchdog (Telemetry & Idempotency) */}
      {activeTab === "webhook" && (
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main stream log */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Razorpay Webhook Stream</h2>
                <p className="text-xs text-muted-foreground">Monitor server-to-server transaction packet streams.</p>
              </div>
              <button
                onClick={refreshTelemetryLogs}
                disabled={isPending}
                className="inline-flex h-8 items-center gap-1 rounded bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[10px] text-zinc-400 space-y-2 h-[450px] overflow-y-auto leading-relaxed">
              <div className="text-zinc-500 border-b border-zinc-800 pb-2 flex justify-between">
                <span>EVENT TRANSACTION LOGS</span>
                <span>STATUS</span>
              </div>
              {webhookLogs.length === 0 ? (
                <p className="italic text-zinc-600 text-center py-12">No telemetry packets received currently.</p>
              ) : (
                webhookLogs.map((log) => (
                  <div key={log._id} className="border-b border-zinc-900 py-2.5 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{log.eventType}</span>
                        <span className="text-zinc-600">ID: {log.eventId}</span>
                      </div>
                      {log.errorMessage && (
                        <div className="text-red-500 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Error: {log.errorMessage}
                        </div>
                      )}
                      <div className="text-zinc-600 text-[9px]">
                        Timestamp: {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold border",
                      log.status === "PROCESSED" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                      log.status === "DUPLICATE" && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                      log.status === "FAILED" && "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Side: Manual sync panel */}
          <div className="lg:col-span-1 border border-border bg-card/25 p-6 rounded-xl space-y-4 h-fit">
            <div className="space-y-1 border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1">
                <Coins className="h-4 w-4 text-primary" />
                Manual Transaction Sync
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                If an external API packet fails to arrive, manually verify the deposit status by entering the Razorpay Order ID.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Order / Mock ID</label>
                <input
                  type="text"
                  placeholder="order_mock_xyz or order_razorpay_123"
                  value={manualOrderId}
                  onChange={(e) => setManualOrderId(e.target.value)}
                  className="w-full h-9 px-3 bg-muted/40 border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <button
                onClick={handleManualSync}
                disabled={isPending || !manualOrderId}
                className="w-full h-9 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Unlock className="h-4 w-4" /> Force Sync PAID status
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

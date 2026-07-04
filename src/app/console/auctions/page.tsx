"use client";

import { useState, useEffect } from "react";
import { getPendingAuctionListings, approveListingConsole, rejectListingConsole, updateListingConsole } from "@/features/console/actions";
import { Gavel, CheckCircle, XCircle, AlertTriangle, Eye, Edit2, X, Sparkles, Trophy, CalendarDays, Coins } from "lucide-react";
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
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

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

  useEffect(() => { load(); }, []);

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
      <div className="border-b border-white/[0.05] pb-5 flex items-center gap-3">
        <Gavel className="h-5 w-5 text-amber-400" />
        <div>
          <h1 className="text-xl font-black text-white">Auction Approvals</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Review, verify, edit, and approve/reject ADMIN-submitted listings</p>
        </div>
      </div>

      {message && (
        <div className={cn(
          "rounded-xl border p-3 text-xs flex items-center gap-2",
          message.success 
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" 
            : "border-red-500/20 bg-red-500/5 text-red-400"
        )}>
          {message.success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 text-xs italic">Loading pending submissions...</p>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.06] py-16 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
          <p className="text-white font-bold text-sm">All Clear</p>
          <p className="text-zinc-500 text-xs mt-1">No pending auction listings to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div key={listing._id} className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-5 space-y-4 hover:border-white/[0.1] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold text-sm">{listing.title}</h3>
                  <p className="text-zinc-500 text-[10px] mt-1">
                    By: <span className="text-zinc-300 font-semibold">@{listing.sellerId?.username || "Unknown"}</span>
                    {" · "}LVL {listing.level} · Team {listing.team}
                    {" · "}Starting Bid: ₹{listing.startingBid.toLocaleString()}
                  </p>
                  <p className="text-zinc-600 text-[10px] mt-0.5">
                    Submitted {new Date(listing.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewClick(listing)}
                    className="h-8 px-3 rounded-lg border border-white/[0.08] hover:bg-white/[0.05] text-zinc-300 hover:text-white text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Verify details
                  </button>
                  <button
                    onClick={() => handleEditClick(listing)}
                    className="h-8 px-3 rounded-lg border border-violet-500/20 hover:border-violet-500/40 bg-violet-600/10 text-violet-400 hover:text-violet-300 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    Pending
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <textarea
                  placeholder="Optional review notes (required for rejection)..."
                  value={notes[listing._id] || ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [listing._id]: e.target.value }))}
                  className="w-full min-h-[50px] p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-colors leading-normal resize-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => approve(listing._id)}
                    disabled={processing === listing._id}
                    className="h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {processing === listing._id ? "Processing..." : "Approve & Go Live"}
                  </button>
                  <button
                    onClick={() => reject(listing._id)}
                    disabled={processing === listing._id}
                    className="h-8 px-4 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
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

      {/* Verification / Details Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-white/[0.08] rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/[0.05] pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  {isEditing ? "Editing Asset Coordinates" : "Verifying Asset Coordinates"}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  {isEditing ? `Edit: ${selectedListing.title}` : selectedListing.title}
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Submitted by @{selectedListing.sellerId?.username || "Unknown"} · {selectedListing.sellerId?.email}
                </p>
              </div>
              <button
                onClick={() => { setSelectedListing(null); setIsEditing(false); }}
                className="h-8 w-8 rounded-lg border border-white/[0.06] hover:bg-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            {isEditing ? (
              /* Editable Form Mode */
              <div className="space-y-6 text-xs text-zinc-300">
                {/* section: Core info */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-violet-400">Core Telemetry</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Listing Title</label>
                      <input
                        type="text"
                        value={editForm.title || ""}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-zinc-500 font-medium">Trainer Level</label>
                        <input
                          type="number"
                          value={editForm.level || 0}
                          onChange={(e) => handleInputChange("level", parseInt(e.target.value))}
                          className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-zinc-500 font-medium">Team faction</label>
                        <select
                          value={editForm.team || "NONE"}
                          onChange={(e) => handleInputChange("team", e.target.value)}
                          className="w-full h-8 px-2 bg-zinc-900 border border-white/[0.08] rounded-lg text-white"
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
                      className="w-full min-h-[60px] p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white"
                    />
                  </div>
                </div>

                {/* section: Pricing Economics */}
                <div className="space-y-3 pt-4 border-t border-white/[0.05]">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-amber-400">Auction Economics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Starting Bid (₹)</label>
                      <input
                        type="number"
                        value={editForm.startingBid || 0}
                        onChange={(e) => handleInputChange("startingBid", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Reserve Price (₹)</label>
                      <input
                        type="number"
                        value={editForm.reservePrice || 0}
                        onChange={(e) => handleInputChange("reservePrice", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Min Increment (₹)</label>
                      <input
                        type="number"
                        value={editForm.minIncrement || 0}
                        onChange={(e) => handleInputChange("minIncrement", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Duration (Hours)</label>
                      <input
                        type="number"
                        value={editForm.durationHours || 0}
                        onChange={(e) => handleInputChange("durationHours", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* section: Metrics telemetry */}
                <div className="space-y-3 pt-4 border-t border-white/[0.05]">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-emerald-400">Account Telemetry & Resources</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Stardust</label>
                      <input
                        type="number"
                        value={editForm.stardust || 0}
                        onChange={(e) => handleInputChange("stardust", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Total XP</label>
                      <input
                        type="number"
                        value={editForm.xp || 0}
                        onChange={(e) => handleInputChange("xp", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Region</label>
                      <input
                        type="text"
                        value={editForm.region || ""}
                        onChange={(e) => handleInputChange("region", e.target.value)}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Shiny Count</label>
                      <input
                        type="number"
                        value={editForm.shinyCount || 0}
                        onChange={(e) => handleInputChange("shinyCount", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
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
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Mythical Count</label>
                      <input
                        type="number"
                        value={editForm.mythicalCount || 0}
                        onChange={(e) => handleInputChange("mythicalCount", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Pokedex Completed %</label>
                      <input
                        type="number"
                        value={editForm.pokedexCompleted || 0}
                        onChange={(e) => handleInputChange("pokedexCompleted", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">PokeCoins Balance</label>
                      <input
                        type="number"
                        value={editForm.pokeCoins || 0}
                        onChange={(e) => handleInputChange("pokeCoins", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
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
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Account Standing</label>
                      <input
                        type="text"
                        value={editForm.accountStatus || ""}
                        onChange={(e) => handleInputChange("accountStatus", e.target.value)}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Link Type</label>
                      <input
                        type="text"
                        value={editForm.accountType || ""}
                        onChange={(e) => handleInputChange("accountType", e.target.value)}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 font-medium">Weekly Distance (km)</label>
                      <input
                        type="number"
                        value={editForm.weeklyDistance || 0}
                        onChange={(e) => handleInputChange("weeklyDistance", parseInt(e.target.value))}
                        className="w-full h-8 px-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* section: inventory items */}
                <div className="space-y-3 pt-4 border-t border-white/[0.05]">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-blue-400">Inventory Items</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Rare Candy</label>
                      <input
                        type="number"
                        value={editForm.rareCandy || 0}
                        onChange={(e) => handleInputChange("rareCandy", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Fast TM</label>
                      <input
                        type="number"
                        value={editForm.fastTm || 0}
                        onChange={(e) => handleInputChange("fastTm", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Charged TM</label>
                      <input
                        type="number"
                        value={editForm.chargedTm || 0}
                        onChange={(e) => handleInputChange("chargedTm", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Elite Fast</label>
                      <input
                        type="number"
                        value={editForm.eliteFastTm || 0}
                        onChange={(e) => handleInputChange("eliteFastTm", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Elite Charged</label>
                      <input
                        type="number"
                        value={editForm.eliteChargedTm || 0}
                        onChange={(e) => handleInputChange("eliteChargedTm", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-500 text-[10px]">Incubators</label>
                      <input
                        type="number"
                        value={editForm.incubators || 0}
                        onChange={(e) => handleInputChange("incubators", parseInt(e.target.value))}
                        className="w-full h-8 px-2 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* actions footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.05]">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="h-9 px-4 rounded-xl border border-white/[0.08] hover:bg-white/[0.05] text-zinc-400 hover:text-white font-bold cursor-pointer"
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
              <div className="space-y-6 text-xs text-zinc-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: General Stats & Telemetry */}
                  <div className="md:col-span-2 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/[0.01] border border-white/[0.05] rounded-xl p-3">
                        <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Stardust</span>
                        <span className="text-white text-sm font-bold mt-1 block">{selectedListing.stardust.toLocaleString()}</span>
                      </div>
                      <div className="bg-white/[0.01] border border-white/[0.05] rounded-xl p-3">
                        <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Total XP</span>
                        <span className="text-white text-sm font-bold mt-1 block">{selectedListing.xp.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/[0.01] border border-white/[0.05] rounded-xl p-3 text-center">
                        <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Shiny</span>
                        <span className="text-yellow-500 text-sm font-black mt-1 block">{selectedListing.shinyCount}✨</span>
                      </div>
                      <div className="bg-white/[0.01] border border-white/[0.05] rounded-xl p-3 text-center">
                        <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Legendary</span>
                        <span className="text-orange-500 text-sm font-black mt-1 block">{selectedListing.legendaryCount}🏆</span>
                      </div>
                      <div className="bg-white/[0.01] border border-white/[0.05] rounded-xl p-3 text-center">
                        <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Mythical</span>
                        <span className="text-purple-500 text-sm font-black mt-1 block">{selectedListing.mythicalCount}🔮</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-zinc-400 font-bold block">Top Pokémon Highlights</span>
                      <p className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-zinc-300 leading-relaxed font-mono">
                        {selectedListing.topPokemon || "None listed"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-zinc-400 font-bold block">Description Details</span>
                      <p className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-zinc-300 leading-relaxed whitespace-pre-line">
                        {selectedListing.description}
                      </p>
                    </div>

                    {/* Screenshot Gallery */}
                    {selectedListing.screenshots && selectedListing.screenshots.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-zinc-400 font-bold block">Uploaded Gallery Screenshots</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {selectedListing.screenshots.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-video rounded-lg overflow-hidden border border-white/[0.08] hover:border-white/30 transition-all bg-zinc-900 group relative"
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
                  <div className="space-y-5 bg-white/[0.01] border border-white/[0.05] rounded-xl p-4 h-fit">
                    <h4 className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-white/[0.05] pb-2">Technical Telemetry</h4>
                    <div className="space-y-2.5 text-[11px]">
                      <div className="flex justify-between"><span className="text-zinc-500">Faction Team:</span><span className="text-white font-semibold">{selectedListing.team}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Region Coverage:</span><span className="text-white font-semibold">{selectedListing.region}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Pokedex Completed:</span><span className="text-white font-semibold">{selectedListing.pokedexCompleted}%</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">PokeCoins:</span><span className="text-white font-semibold">{selectedListing.pokeCoins}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Best Buddies:</span><span className="text-white font-semibold">{selectedListing.bestBuddyCount}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Link Method:</span><span className="text-white font-semibold">{selectedListing.accountType}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Account Health:</span><span className="text-emerald-400 font-semibold">{selectedListing.accountStatus}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Registration Date:</span><span className="text-white font-semibold">{selectedListing.startDate}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Weekly Distance:</span><span className="text-white font-semibold">{selectedListing.weeklyDistance} km</span></div>
                    </div>

                    <h4 className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-white/[0.05] pt-3 pb-2">Inventory Ledger</h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-500 block">Rare Candy</span><span className="text-white font-bold">{selectedListing.rareCandy}</span></div>
                      <div className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-500 block">Fast TM</span><span className="text-white font-bold">{selectedListing.fastTm}</span></div>
                      <div className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-500 block">Charged</span><span className="text-white font-bold">{selectedListing.chargedTm}</span></div>
                      <div className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-500 block">Elite Fast</span><span className="text-white font-bold">{selectedListing.eliteFastTm}</span></div>
                      <div className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-500 block">Elite Chg</span><span className="text-white font-bold">{selectedListing.eliteChargedTm}</span></div>
                      <div className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg"><span className="text-zinc-500 block">Incubator</span><span className="text-white font-bold">{selectedListing.incubators}</span></div>
                    </div>

                    <h4 className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-white/[0.05] pt-3 pb-2">Bidding Economics</h4>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between"><span className="text-zinc-500">Starting Price:</span><span className="text-white font-bold">₹{selectedListing.startingBid.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Reserve Price:</span><span className="text-white font-bold">₹{selectedListing.reservePrice.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Min Increment:</span><span className="text-white font-semibold">₹{selectedListing.minIncrement.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Auction Window:</span><span className="text-white font-semibold">{selectedListing.durationHours} Hours</span></div>
                    </div>
                  </div>
                </div>

                {/* Review note area */}
                <div className="space-y-3 pt-6 border-t border-white/[0.05]">
                  <label className="font-bold text-white uppercase tracking-wider text-[10px] block">Review Action Comments</label>
                  <textarea
                    placeholder="Provide review context, feedback notes or rejection reasons..."
                    value={notes[selectedListing._id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [selectedListing._id]: e.target.value }))}
                    className="w-full min-h-[70px] p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-colors leading-normal"
                  />
                </div>

                {/* Action Row */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-white/[0.05]">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="h-9 px-4 rounded-xl border border-violet-500/20 hover:border-violet-500/40 bg-violet-600/10 text-violet-400 hover:text-violet-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Metrics
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => reject(selectedListing._id)}
                      disabled={processing === selectedListing._id}
                      className="h-9 px-4 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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

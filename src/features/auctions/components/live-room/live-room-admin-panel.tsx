"use client";

import { ShieldAlert, Play, AlertCircle, Trophy, Gavel, Trash2 } from "lucide-react";

interface AdminEditForm {
  title: string;
  description: string;
  level: number;
  team: string;
  shinyCount: number;
  legendaryCount: number;
  mythicalCount: number;
  region: string;
  startingBid: number;
  reservePrice?: number;
  minIncrement: number;
  stardust: number;
  xp: number;
  pokedexCompleted: number;
  bestBuddyCount: number;
  pokeCoins: number;
  startDate: string;
  accountType: string;
  accountStatus: string;
  weeklyDistance: number;
  topPokemon: string;
  rareCandy: number;
  fastTm: number;
  chargedTm: number;
  eliteFastTm: number;
  eliteChargedTm: number;
  incubators: number;
  luckyEggs: number;
  lureModules: number;
  premiumRaidPass: number;
  endTime: string;
  registrationFee: number;
  [key: string]: any;
}

interface LiveRoomAdminPanelProps {
  isSuperAdmin: boolean;
  isCreatorAdmin: boolean;
  status: string;
  adminActionError: string | null;
  isAdminActionLoading: boolean;
  onPauseAuction: () => Promise<void>;
  onResumeAuction: () => Promise<void>;
  onForceEndAuction: () => Promise<void>;
  onReactivateAuction: () => void;
  onDeleteAuction: () => void;
  onOpenEdit: () => void;
}

export function LiveRoomAdminPanel({
  isSuperAdmin,
  isCreatorAdmin,
  status,
  adminActionError,
  isAdminActionLoading,
  onPauseAuction,
  onResumeAuction,
  onForceEndAuction,
  onReactivateAuction,
  onDeleteAuction,
  onOpenEdit,
}: LiveRoomAdminPanelProps) {
  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50/55 dark:bg-violet-600/5 backdrop-blur-md p-5 space-y-4 shadow-md relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-violet-500/10 blur-xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-violet-200 dark:border-violet-500/20 pb-3">
        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
          <ShieldAlert className="h-4.5 w-4.5 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            Admin Control Panel
          </span>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-450/20">
          {isSuperAdmin ? "SUPER ADMIN" : "OWNER ADMIN"}
        </span>
      </div>

      {adminActionError && (
        <div className="text-[10px] text-red-500 bg-red-500/10 p-2.5 rounded border border-red-500/20 leading-relaxed">
          {adminActionError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Pause / Resume Button */}
        {status === "PAUSED" ? (
          <button
            onClick={onResumeAuction}
            disabled={isAdminActionLoading}
            className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Resume Bidding
          </button>
        ) : (
          <button
            onClick={onPauseAuction}
            disabled={isAdminActionLoading || status === "COMPLETED"}
            className="h-10 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <AlertCircle className="h-4 w-4" />
            Pause Bidding
          </button>
        )}

        {/* End Auction Button */}
        <button
          onClick={onForceEndAuction}
          disabled={isAdminActionLoading || status === "COMPLETED"}
          className="h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
        >
          <Trophy className="h-4 w-4" />
          End Auction
        </button>
      </div>

      {/* Edit Button */}
      <button
        onClick={onOpenEdit}
        disabled={isAdminActionLoading}
        className="w-full h-10 rounded-xl border border-violet-200 dark:border-violet-500/30 hover:border-violet-300 dark:hover:border-violet-500/50 bg-violet-50 dark:bg-violet-600/10 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-600/20 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
      >
        <Gavel className="h-4 w-4" />
        Edit Auction Details
      </button>

      {/* Reactivate Auction Button (SUPER_ADMIN only, shown when auction is completed/expired) */}
      {isSuperAdmin && status === "COMPLETED" && (
        <button
          onClick={onReactivateAuction}
          disabled={isAdminActionLoading}
          className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 mt-1"
        >
          <Play className="h-4 w-4 animate-pulse" />
          Reactivate &amp; Extend Auction
        </button>
      )}

      {/* Delete Auction Button (SUPER_ADMIN only) */}
      {isSuperAdmin && (
        <button
          onClick={onDeleteAuction}
          disabled={isAdminActionLoading}
          className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/10 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 mt-1"
        >
          <Trash2 className="h-4 w-4" />
          Delete Auction &amp; Listing
        </button>
      )}
    </div>
  );
}

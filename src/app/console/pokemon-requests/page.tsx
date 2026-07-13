"use client";

import { useState, useEffect } from "react";
import { getPokemonRequests, updatePokemonRequestStatus, deletePokemonRequest } from "@/features/admin/actions";
import { Check, X, Trash2, AlertTriangle, ShieldCheck, Mail, MessageCircle, User } from "lucide-react";

interface PokemonRequestData {
  _id: string;
  userId: string;
  username: string;
  email: string;
  pokemonName: string;
  description: string;
  socialPlatform: string;
  socialId: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  createdAt: string;
}

export default function PokemonRequestsPage() {
  const [requests, setRequests] = useState<PokemonRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    const res = await getPokemonRequests();
    if (res.success && res.requests) {
      setRequests(res.requests);
    } else {
      setError(res.error || "Failed to load Pokémon requests.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleUpdateStatus = async (id: string, status: "PENDING" | "COMPLETED" | "REJECTED") => {
    const res = await updatePokemonRequestStatus(id, status);
    if (res.success) {
      setRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, status } : req))
      );
    } else {
      alert(res.error || "Failed to update request status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Pokémon request?")) return;
    const res = await deletePokemonRequest(id);
    if (res.success) {
      setRequests((prev) => prev.filter((req) => req._id !== id));
    } else {
      alert(res.error || "Failed to delete request.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Pokémon Custom Requests</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Review and manage Pokémon sourcing requests submitted by users.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-650 dark:text-red-400 flex items-start gap-2 max-w-2xl leading-normal">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Execution Error:</span> {error}
          </div>
        </div>
      )}

      {/* Requests Table */}
      <div className="border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] rounded-lg overflow-x-auto shadow-xs">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/[0.06] text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Trainer Details</th>
              <th className="px-6 py-4">Requested Pokémon</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Social ID / Contact</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.06] text-zinc-700 dark:text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 italic">
                  Loading requested pokemons...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 italic">
                  No Pokémon requests currently active.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white leading-none">
                      <User className="h-3 w-3 text-zinc-400" />
                      {req.username}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <Mail className="h-3 w-3 text-zinc-400" />
                      {req.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/[0.05] bg-zinc-100 dark:bg-white/[0.02] text-[10px] font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      {req.pokemonName}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="leading-relaxed text-zinc-600 dark:text-zinc-400 break-words whitespace-pre-wrap">{req.description}</p>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <span className="px-2 py-0.5 rounded bg-[#24A1DE]/10 text-[#24A1DE] text-[9px] font-bold uppercase tracking-wider">
                      {req.socialPlatform}
                    </span>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs mt-1">{req.socialId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        req.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : req.status === "REJECTED"
                          ? "bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-1.5 mt-2">
                    {req.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleUpdateStatus(req._id, "COMPLETED")}
                        className="h-7 px-2.5 rounded-md border border-zinc-200 hover:bg-emerald-500/10 dark:border-white/[0.08] dark:hover:bg-emerald-500/10 text-zinc-550 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Mark Completed"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-bold uppercase">Done</span>
                      </button>
                    )}
                    {req.status !== "REJECTED" && (
                      <button
                        onClick={() => handleUpdateStatus(req._id, "REJECTED")}
                        className="h-7 px-2.5 rounded-md border border-zinc-200 hover:bg-red-500/10 dark:border-white/[0.08] dark:hover:bg-red-500/10 text-zinc-550 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-450 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Mark Rejected"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-bold uppercase">Reject</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(req._id)}
                      className="h-7 w-7 rounded-md text-zinc-400 hover:text-red-550 hover:bg-red-500/5 flex items-center justify-center cursor-pointer transition-colors"
                      title="Delete Request"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

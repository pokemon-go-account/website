"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Eye,
  Globe,
  FileText,
  Smartphone,
  Monitor,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Radio,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { getDb } from "@/lib/firestore";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { fetchAnalyticsData, fetchActivePresence } from "@/features/analytics/actions";

interface ActiveSession {
  visitorId: string;
  path: string;
  country: string;
  countryCode: string;
  device?: string;
  lastActive: number;
}

interface AnalyticsData {
  range: string;
  totalViews: number;
  totalUniqueVisitors: number;
  countryStats: { countryCode: string; country: string; views: number; uniqueVisitors: number }[];
  pageStats: { path: string; views: number; uniqueVisitors: number }[];
  deviceStats: { device: string; count: number }[];
  timeline: { label: string; views: number }[];
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode === "UN" || countryCode.length !== 2) return "🌐";
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

export default function AnalyticsConsolePage() {
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState<AnalyticsData | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0);

  // 1. Fetch Historical Aggregate Stats
  const loadStats = async (selectedRange = range) => {
    setLoading(true);
    const res = await fetchAnalyticsData(selectedRange);
    if (res.success && res.data) {
      setHistoricalData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats(range);
  }, [range]);

  // 2. Real-time Presence sync (Hybrid Firestore + Server Action fallback)
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    // Firestore listener
    try {
      const db = getDb();
      const colRef = collection(db, "active_sessions");
      const activeThreshold = Date.now() - 45000;
      const q = query(colRef, where("lastActive", ">=", activeThreshold));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const sessions: ActiveSession[] = [];
          const now = Date.now();
          snapshot.forEach((doc) => {
            const data = doc.data() as ActiveSession;
            if (now - (data.lastActive || 0) <= 30000) {
              sessions.push(data);
            }
          });
          if (sessions.length > 0) {
            setActiveSessions(sessions);
            setLastUpdatedSec(0);
          }
        },
        () => {}
      );
    } catch {
      // Soft catch
    }

    // Direct server action poll fallback every 2s
    const pollPresence = async () => {
      const res = await fetchActivePresence();
      if (res.success && Array.isArray(res.activeSessions)) {
        setActiveSessions((prev) => {
          const mergedMap = new Map<string, ActiveSession>();
          prev.forEach((s) => mergedMap.set(s.visitorId, s));
          res.activeSessions?.forEach((s: ActiveSession) => mergedMap.set(s.visitorId, s));
          return Array.from(mergedMap.values());
        });
        setLastUpdatedSec(0);
      }
    };

    pollPresence();
    const presenceTimer = setInterval(pollPresence, 2000);

    return () => {
      unsubscribe();
      clearInterval(presenceTimer);
    };
  }, []);

  // 3. 1-second interval ticker for live status clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdatedSec((prev) => prev + 1);
      const now = Date.now();
      setActiveSessions((prev) => prev.filter((s) => now - (s.lastActive || 0) <= 30000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Deduplicated Active Visitors count (1 person with 5 tabs = 1 active user)
  const uniqueActiveUsersCount = useMemo(() => {
    const uniqueIds = new Set(activeSessions.map((s) => s.visitorId));
    return uniqueIds.size;
  }, [activeSessions]);

  // Group active sessions by path
  const activePagesBreakdown = useMemo(() => {
    const map = new Map<string, Set<string>>();
    activeSessions.forEach((s) => {
      const path = s.path || "/";
      if (!map.has(path)) map.set(path, new Set());
      map.get(path)!.add(s.visitorId);
    });

    return Array.from(map.entries())
      .map(([path, visitors]) => ({ path, count: visitors.size }))
      .sort((a, b) => b.count - a.count);
  }, [activeSessions]);

  // Group active sessions by country
  const activeCountriesBreakdown = useMemo(() => {
    const map = new Map<string, { country: string; countryCode: string; visitors: Set<string> }>();
    activeSessions.forEach((s) => {
      const code = s.countryCode || "UN";
      if (!map.has(code)) {
        map.set(code, { country: s.country || "Unknown", countryCode: code, visitors: new Set() });
      }
      map.get(code)!.visitors.add(s.visitorId);
    });

    return Array.from(map.values())
      .map((item) => ({
        countryCode: item.countryCode,
        country: item.country,
        count: item.visitors.size,
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeSessions]);

  return (
    <div className="space-y-8 max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              Web Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Engine
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time presence telemetry, visitor country distribution, and view metrics.
          </p>
        </div>

        {/* Time Range Switcher */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg border border-zinc-200 dark:border-white/[0.06] shrink-0 self-start sm:self-auto">
          {(["24h", "7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                range === r
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => loadStats()}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors ml-1"
            title="Refresh stats"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* VERCEL-STYLE HERO ACTIVE USERS CARD */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 dark:from-[#0d0d0e] dark:via-[#111113] dark:to-[#09090a] text-white p-6 sm:p-8 border border-zinc-800 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
              <Radio className="h-4 w-4 animate-pulse text-emerald-400" />
              Live Right Now
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono text-white">
                {uniqueActiveUsersCount}
              </span>
              <span className="text-sm sm:text-base text-zinc-400 font-medium">
                active {uniqueActiveUsersCount === 1 ? "visitor" : "visitors"} on site
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              Updated sub-second ({lastUpdatedSec}s ago) · Multi-tab deduplicated
            </p>
          </div>

          {/* Quick Active Stats Chips */}
          <div className="flex flex-wrap gap-3 lg:justify-end border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 min-w-[130px]">
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">Active Pages</p>
              <p className="text-xl font-bold font-mono text-white mt-0.5">
                {activePagesBreakdown.length}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 min-w-[130px]">
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">Active Countries</p>
              <p className="text-xl font-bold font-mono text-white mt-0.5">
                {activeCountriesBreakdown.length}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 min-w-[130px]">
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">{range.toUpperCase()} Views</p>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {historicalData?.totalViews?.toLocaleString() ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Total Views ({range})</span>
            <Eye className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-white mt-2 font-mono">
            {historicalData?.totalViews?.toLocaleString() ?? "0"}
          </p>
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Tracked page visits</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Unique Visitors ({range})</span>
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-white mt-2 font-mono">
            {historicalData?.totalUniqueVisitors?.toLocaleString() ?? "0"}
          </p>
          <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 mt-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Unique browser devices</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Top Device</span>
            <Monitor className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-white mt-2 capitalize font-mono">
            {historicalData?.deviceStats?.[0]?.device || "Desktop"}
          </p>
          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-2">
            <span>
              {historicalData?.deviceStats?.[0]?.count ?? 0} views on primary platform
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN SECTION: REAL-TIME PAGES & GEOGRAPHY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ACTIVE PAGES RIGHT NOW */}
        <div className="lg:col-span-6">
          <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Active Pages Right Now</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Where visitors are currently browsing</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                {activePagesBreakdown.length} live routes
              </span>
            </div>

            <div className="p-5 flex-1 overflow-y-auto max-h-[380px]">
              {activePagesBreakdown.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-sm">
                  <p>No active visitors browsing pages right now</p>
                  <p className="text-xs text-zinc-500 mt-1">Open storefront routes in a new tab to see live activity!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePagesBreakdown.map((item) => {
                    const pct = uniqueActiveUsersCount > 0 ? Math.round((item.count / uniqueActiveUsersCount) * 100) : 0;
                    return (
                      <div key={item.path} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium truncate max-w-[280px]">
                            {item.path}
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                            {item.count} active ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ACTIVE & HISTORICAL COUNTRIES */}
        <div className="lg:col-span-6">
          <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Geographic Demographics</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Visitors by country</p>
                </div>
              </div>
              <span className="text-xs font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium">
                {historicalData?.countryStats?.length || activeCountriesBreakdown.length} countries
              </span>
            </div>

            <div className="p-5 flex-1 overflow-y-auto max-h-[380px]">
              {/* Combine active countries with historical stats */}
              {(!historicalData?.countryStats || historicalData.countryStats.length === 0) && activeCountriesBreakdown.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-sm">
                  No country location data logged yet
                </div>
              ) : (
                <div className="space-y-4">
                  {(historicalData?.countryStats && historicalData.countryStats.length > 0
                    ? historicalData.countryStats
                    : activeCountriesBreakdown.map((a) => ({
                        countryCode: a.countryCode,
                        country: a.country,
                        views: a.count,
                        uniqueVisitors: a.count,
                      }))
                  ).map((item) => {
                    const total = historicalData?.totalViews || uniqueActiveUsersCount || 1;
                    const pct = Math.round((item.views / total) * 100);
                    const activeNowCount = activeCountriesBreakdown.find((a) => a.countryCode === item.countryCode)?.count || 0;

                    return (
                      <div key={item.countryCode} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base leading-none">{getFlagEmoji(item.countryCode)}</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {item.country}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">({item.countryCode})</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {activeNowCount > 0 && (
                              <span className="text-[11px] font-mono text-emerald-500 font-medium">
                                {activeNowCount} live
                              </span>
                            )}
                            <span className="font-mono text-zinc-600 dark:text-zinc-400 font-medium">
                              {item.views} views
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* TOP HISTORICAL PAGES TABLE */}
      <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.06]">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Most Viewed Pages ({range})</h3>
          <p className="text-xs text-zinc-500 mt-0.5">All-time traffic by URL path</p>
        </div>

        {(!historicalData?.pageStats || historicalData.pageStats.length === 0) ? (
          <div className="py-12 text-center text-zinc-400 text-sm">
            No historical page view records found in database
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/[0.06] text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Path</th>
                  <th className="px-5 py-3 font-medium text-right">Total Views</th>
                  <th className="px-5 py-3 font-medium text-right">Unique Visitors</th>
                  <th className="px-5 py-3 font-medium text-right">% Traffic Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                {historicalData.pageStats.map((item) => {
                  const pct = historicalData.totalViews > 0 ? ((item.views / historicalData.totalViews) * 100).toFixed(1) : "0";
                  return (
                    <tr key={item.path} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                        {item.path}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                        {item.views.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-zinc-500">
                        {item.uniqueVisitors.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

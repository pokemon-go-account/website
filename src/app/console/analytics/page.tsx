"use client";

import { useEffect, useState, useMemo } from "react";
import { database, app } from "@/lib/firebase";
import { ref, onValue, getDatabase } from "firebase/database";
import { decodePathKey } from "@/components/presence-tracker";
import Link from "next/link";
import { 
  Users, 
  Globe, 
  Compass, 
  Zap, 
  ShieldCheck, 
  Laptop, 
  Smartphone, 
  ExternalLink,
  Activity,
  UserCheck,
  Eye,
  Calendar,
  BarChart3,
  TrendingUp,
  MapPin,
  Sparkles
} from "lucide-react";

interface VisitorPresence {
  presenceKey?: string;
  sessionId: string;
  visitorId?: string;
  userId?: string | null;
  userName: string;
  userEmail?: string | null;
  userImage?: string | null;
  pathname: string;
  pageTitle: string;
  country: string;
  countryCode: string;
  flag: string;
  device: string;
  lastSeen: number;
}

type TimeRange = "7d" | "14d" | "30d";

export default function AnalyticsConsolePage() {
  const [visitors, setVisitors] = useState<VisitorPresence[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [hoveredPage, setHoveredPage] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Subscribe to realtime presence
  useEffect(() => {
    const db = database || (app ? getDatabase(app) : null);
    if (!db) return;

    const presenceRef = ref(db, "presence");
    const unsubPresence = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setVisitors([]);
        return;
      }
      const now = Date.now();
      const list: any[] = Object.values(data);
      const activeList: VisitorPresence[] = [];

      list.forEach((v) => {
        if (v.tabs && typeof v.tabs === "object") {
          const tabList: any[] = Object.values(v.tabs);
          if (tabList.length > 0) {
            tabList.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
            const latestTab = tabList[0];
            if (latestTab.lastSeen && now - latestTab.lastSeen < 30000) {
              activeList.push({
                ...v,
                pathname: latestTab.pathname || v.pathname || "/",
                pageTitle: latestTab.pageTitle || v.pageTitle || "/",
                lastSeen: latestTab.lastSeen || v.lastSeen,
              });
            }
          }
        }
      });

      // Deduplicate multi-tab visitors by userId or visitorId
      const deduplicatedMap = new Map<string, VisitorPresence>();
      activeList.forEach((v) => {
        const key = v.userId || v.visitorId || v.sessionId;
        const existing = deduplicatedMap.get(key);
        if (!existing || (v.lastSeen || 0) > (existing.lastSeen || 0)) {
          deduplicatedMap.set(key, v);
        }
      });

      const deduplicatedList = Array.from(deduplicatedMap.values());
      deduplicatedList.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
      setVisitors(deduplicatedList);
    });

    // Subscribe to historical analytics data (0 Vercel API pings)
    const analyticsRef = ref(db, "analytics");
    const unsubAnalytics = onValue(analyticsRef, (snapshot) => {
      setAnalyticsData(snapshot.val() || {});
    });

    return () => {
      unsubPresence();
      unsubAnalytics();
    };
  }, []);

  // Dynamically extract all known countries from live visitors & telemetry history
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    visitors.forEach((v) => {
      if (v.country && v.country.trim()) set.add(v.country.trim());
    });
    if (analyticsData?.countryMeta) {
      Object.values(analyticsData.countryMeta).forEach((meta: any) => {
        if (meta?.country && meta.country.trim()) set.add(meta.country.trim());
      });
    }
    return Array.from(set).sort();
  }, [visitors, analyticsData]);

  // Compute date array for 7d, 14d, 30d
  const dateList = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }, [timeRange]);

  // Filtered live visitors based on selected country
  const filteredVisitors = useMemo(() => {
    if (selectedCountry === "ALL") return visitors;
    return visitors.filter((v) => (v.country || "").toLowerCase() === selectedCountry.toLowerCase());
  }, [visitors, selectedCountry]);

  // Aggregate Total Views, Unique Views, and Country Breakdown over selected date range and country filter
  const { totalViewsPeriod, uniqueViewsPeriod, pageViewStatsPeriod, countryTrafficPeriod } = useMemo(() => {
    if (!analyticsData) {
      return { totalViewsPeriod: 0, uniqueViewsPeriod: 0, pageViewStatsPeriod: [], countryTrafficPeriod: [] };
    }

    const dailyViews = analyticsData.dailyViews || {};
    const pageViews = analyticsData.pageViews || {};
    const pageTitles = analyticsData.pageTitles || {};
    const uniqueVisitors = analyticsData.uniqueVisitors || {};
    const countryViews = analyticsData.countryViews || {};
    const countryMeta = analyticsData.countryMeta || {};

    let totalViews = 0;
    const uniqueVisitorSet = new Set<string>();
    const pageMap = new Map<string, { pathKey: string; pathname: string; pageTitle: string; views: number; uniqueSet: Set<string> }>();
    const countryMap = new Map<string, { countryCode: string; country: string; flag: string; views: number; uniqueSet: Set<string> }>();

    dateList.forEach((dateStr) => {
      // Country views per date & total view filtering
      if (countryViews[dateStr]) {
        Object.entries(countryViews[dateStr]).forEach(([cCode, count]) => {
          const numCount = Number(count) || 0;
          const meta = countryMeta[cCode] || { country: cCode, flag: "🌐", countryCode: cCode };
          const countryName = meta.country || cCode;

          if (selectedCountry !== "ALL" && countryName.toLowerCase() !== selectedCountry.toLowerCase()) {
            return;
          }

          totalViews += numCount;

          const existing = countryMap.get(cCode);
          if (existing) {
            existing.views += numCount;
          } else {
            countryMap.set(cCode, {
              countryCode: cCode,
              country: countryName,
              flag: meta.flag || "🌐",
              views: numCount,
              uniqueSet: new Set(),
            });
          }
        });
      } else if (selectedCountry === "ALL" && dailyViews[dateStr]) {
        totalViews += Number(dailyViews[dateStr]) || 0;
      }

      // Unique visitors per date
      if (uniqueVisitors[dateStr]) {
        Object.entries(uniqueVisitors[dateStr]).forEach(([vId, val]: [string, any]) => {
          const vCountry = val?.country || (val?.countryCode ? countryMeta[val.countryCode]?.country : "") || "";
          if (selectedCountry !== "ALL" && vCountry.toLowerCase() !== selectedCountry.toLowerCase()) {
            return;
          }

          uniqueVisitorSet.add(vId);
          if (val && val.countryCode) {
            const cCode = val.countryCode;
            const meta = countryMeta[cCode] || { country: val.country || cCode, flag: val.flag || "🌐", countryCode: cCode };
            const existing = countryMap.get(cCode);
            if (existing) {
              existing.uniqueSet.add(vId);
            } else {
              countryMap.set(cCode, {
                countryCode: cCode,
                country: meta.country,
                flag: meta.flag,
                views: 0,
                uniqueSet: new Set([vId]),
              });
            }
          }
        });
      }

      // Page level views per date
      if (pageViews[dateStr]) {
        Object.entries(pageViews[dateStr]).forEach(([pKey, count]) => {
          const path = decodePathKey(pKey);
          const title = pageTitles[pKey] || path;
          const numCount = Number(count) || 0;

          // If filtering by country, estimate page views for that country proportional to country share
          if (selectedCountry !== "ALL") {
            const matchingVisitorsOnPage = uniqueVisitors[dateStr]
              ? Object.values(uniqueVisitors[dateStr]).filter(
                  (v: any) =>
                    v?.lastPath === path &&
                    (v?.country || countryMeta[v?.countryCode]?.country || "").toLowerCase() === selectedCountry.toLowerCase()
                ).length
              : 0;

            if (matchingVisitorsOnPage === 0 && uniqueVisitors[dateStr]) {
              return;
            }
          }

          const existing = pageMap.get(pKey);
          if (existing) {
            existing.views += numCount;
          } else {
            pageMap.set(pKey, {
              pathKey: pKey,
              pathname: path,
              pageTitle: title,
              views: numCount,
              uniqueSet: new Set<string>(),
            });
          }

          if (uniqueVisitors[dateStr]) {
            Object.entries(uniqueVisitors[dateStr]).forEach(([vId, val]: [string, any]) => {
              const vCountry = val?.country || (val?.countryCode ? countryMeta[val.countryCode]?.country : "") || "";
              if (selectedCountry !== "ALL" && vCountry.toLowerCase() !== selectedCountry.toLowerCase()) {
                return;
              }
              if (val?.lastPath === path) {
                pageMap.get(pKey)?.uniqueSet.add(vId);
              }
            });
          }
        });
      }
    });

    const pageStatsList = Array.from(pageMap.values())
      .map((item) => ({
        ...item,
        uniqueViews: item.uniqueSet.size || Math.min(item.views, uniqueVisitorSet.size),
      }))
      .sort((a, b) => b.views - a.views);

    const countryList = Array.from(countryMap.values())
      .map((item) => ({
        ...item,
        uniqueVisitors: item.uniqueSet.size || Math.min(item.views, uniqueVisitorSet.size),
      }))
      .sort((a, b) => b.views - a.views);

    return {
      totalViewsPeriod: totalViews,
      uniqueViewsPeriod: uniqueVisitorSet.size,
      pageViewStatsPeriod: pageStatsList,
      countryTrafficPeriod: countryList,
    };
  }, [analyticsData, dateList, selectedCountry]);

  // Realtime Live Page breakdown aggregation
  const livePageStats = useMemo(() => {
    const map = new Map<string, { pathname: string; pageTitle: string; count: number; users: VisitorPresence[] }>();
    filteredVisitors.forEach((v) => {
      const path = v.pathname || "/";
      const existing = map.get(path);
      if (existing) {
        existing.count += 1;
        existing.users.push(v);
      } else {
        map.set(path, {
          pathname: path,
          pageTitle: v.pageTitle || path,
          count: 1,
          users: [v],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredVisitors]);

  // Realtime Live Country breakdown aggregation
  const liveCountryStats = useMemo(() => {
    const map = new Map<string, { country: string; flag: string; count: number; users: VisitorPresence[] }>();
    filteredVisitors.forEach((v) => {
      const country = v.country || "United States";
      const flag = v.flag || "🇺🇸";
      const existing = map.get(country);
      if (existing) {
        existing.count += 1;
        existing.users.push(v);
      } else {
        map.set(country, { country, flag, count: 1, users: [v] });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredVisitors]);

  return (
    <div className="space-y-8 max-w-6xl pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-zinc-900/80 border border-white/[0.08] p-6 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Web Analytics & Live Telemetry
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Live Direct WebSocket
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">
            Real-time visitor presence & historical traffic telemetry · 0 Vercel Fluid CPU Charges
          </p>
        </div>

        {/* TIME RANGE & COUNTRY SELECTOR CONTROLS */}
        <div className="z-10 flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Country Selector Dropdown */}
          <div className="inline-flex items-center px-3 py-2 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md gap-2 shadow-inner">
            <Globe className="h-4 w-4 text-purple-400 shrink-0" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-zinc-900 text-white">🌐 All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c} className="bg-zinc-900 text-white">
                  📍 {c}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="inline-flex items-center p-1.5 bg-black/40 border border-white/10 rounded-2xl shadow-inner backdrop-blur-md">
            <button
              onClick={() => setTimeRange("7d")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                timeRange === "7d"
                  ? "bg-gradient-to-r from-[#6133e1] to-[#8b5cf6] text-white shadow-lg shadow-[#6133e1]/30 border border-white/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              7 Days
            </button>
            <button
              onClick={() => setTimeRange("14d")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                timeRange === "14d"
                  ? "bg-gradient-to-r from-[#6133e1] to-[#8b5cf6] text-white shadow-lg shadow-[#6133e1]/30 border border-white/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              14 Days
            </button>
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                timeRange === "30d"
                  ? "bg-gradient-to-r from-[#6133e1] to-[#8b5cf6] text-white shadow-lg shadow-[#6133e1]/30 border border-white/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              30 Days
            </button>
          </div>
        </div>

        {/* Ambient glow background */}
        <div className="absolute -right-10 -top-10 h-32 w-32 bg-[#6133e1]/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Active Country Filter Notification Banner */}
      {selectedCountry !== "ALL" && (
        <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 px-5 py-3 rounded-2xl text-xs font-bold text-purple-300 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-400 shrink-0" />
            <span>Filtering Telemetry Dashboard for Country: <strong className="text-white font-extrabold">{selectedCountry}</strong></span>
          </div>
          <button
            onClick={() => setSelectedCountry("ALL")}
            className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-white text-[11px] font-extrabold transition-colors cursor-pointer"
          >
            Clear Country Filter
          </button>
        </div>
      )}

      {/* Primary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views in Period */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Views ({timeRange})</span>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Eye className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{totalViewsPeriod}</span>
            <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" /> page hits
            </span>
          </div>
        </div>

        {/* Unique Views in Period */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Unique Visitors ({timeRange})</span>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{uniqueViewsPeriod}</span>
            <span className="text-xs text-purple-400 font-bold">unique devices</span>
          </div>
        </div>

        {/* Online Right Now */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Online Right Now</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 tracking-tight">{visitors.length}</span>
            <span className="text-xs text-emerald-400 font-bold">live visitors</span>
          </div>
        </div>

        {/* Vercel Execution Metric */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Vercel Fluid CPU</span>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">0.00 ms</span>
            <span className="text-xs text-zinc-400 font-bold">0 serverless pings</span>
          </div>
        </div>
      </div>

      {/* Grid: Currently Active Pages & Active Countries with User Hover Tooltips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Active Pages Breakdown */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-amber-500" />
                Currently Active Pages
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Hover over any page to view active usernames right now</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-white/10">
              {livePageStats.length} Pages
            </span>
          </div>

          {livePageStats.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-400">No active page sessions detected right now</div>
          ) : (
            <div className="space-y-3">
              {livePageStats.map((item, idx) => {
                const pct = Math.round((item.count / visitors.length) * 100) || 0;
                const isHovered = hoveredPage === item.pathname;

                return (
                  <div
                    key={`${item.pathname}_${idx}`}
                    onMouseEnter={() => setHoveredPage(item.pathname)}
                    onMouseLeave={() => setHoveredPage(null)}
                    className="relative group p-3 rounded-2xl transition-all hover:bg-zinc-50 dark:hover:bg-white/[0.03] border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                      <div className="flex items-center gap-2 truncate max-w-[75%]">
                        <span className="font-mono text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg font-bold shrink-0">
                          {item.pathname}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 truncate">{item.pageTitle}</span>
                      </div>
                      <span className="text-zinc-900 dark:text-white font-bold shrink-0">
                        {item.count} {item.count === 1 ? "visitor" : "visitors"} ({pct}%)
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Hover User Tooltip */}
                    {isHovered && item.users.length > 0 && (
                      <div className="absolute left-0 top-full mt-2 z-30 w-72 bg-zinc-900 text-white rounded-2xl p-4 shadow-2xl border border-white/10 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="font-bold border-b border-white/10 pb-2 flex items-center justify-between text-zinc-300">
                          <span>People on {item.pathname}:</span>
                          <span className="text-amber-400 font-mono font-bold">{item.users.length}</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                          {item.users.map((u, uIdx) => (
                            <div key={u.presenceKey ? `${u.presenceKey}_${uIdx}` : `u_${uIdx}`} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                                <span className="font-semibold text-zinc-200 truncate">{u.userName}</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 shrink-0 font-medium">{u.flag} {u.country}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Active Countries Breakdown */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-400" />
                Active Countries Right Now
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Hover over any country to view active usernames right now</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-white/10">
              {liveCountryStats.length} Countries
            </span>
          </div>

          {liveCountryStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">No active locations detected right now</div>
          ) : (
            <div className="space-y-3">
              {liveCountryStats.map((item, idx) => {
                const pct = Math.round((item.count / visitors.length) * 100) || 0;
                const isHovered = hoveredCountry === item.country;

                return (
                  <div
                    key={`${item.country}_${idx}`}
                    onMouseEnter={() => setHoveredCountry(item.country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    className="relative group p-3 rounded-2xl transition-all hover:bg-zinc-50 dark:hover:bg-white/[0.03] border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.flag}</span>
                        <span className="text-zinc-900 dark:text-white font-bold">{item.country}</span>
                      </div>
                      <span className="text-zinc-900 dark:text-white font-bold">
                        {item.count} {item.count === 1 ? "visitor" : "visitors"} ({pct}%)
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Hover User Tooltip */}
                    {isHovered && item.users.length > 0 && (
                      <div className="absolute left-0 top-full mt-2 z-30 w-72 bg-zinc-900 text-white rounded-2xl p-4 shadow-2xl border border-white/10 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="font-bold border-b border-white/10 pb-2 flex items-center justify-between text-zinc-300">
                          <span>{item.flag} Users from {item.country}:</span>
                          <span className="text-purple-400 font-mono font-bold">{item.users.length}</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                          {item.users.map((u, uIdx) => (
                            <div key={u.presenceKey ? `${u.presenceKey}_${uIdx}` : `u_${uIdx}`} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                                <span className="font-semibold text-zinc-200 truncate">{u.userName}</span>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-400 bg-white/10 px-2 py-0.5 rounded-lg truncate max-w-[110px]">
                                {u.pathname}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Live Online Visitors Stream Table */}
      <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm space-y-4">
        <div className="p-6 pb-0 flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Live Online Visitors Stream
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live updating stream of connected users & their current pages
            </p>
          </div>
          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
            {visitors.length} Connected
          </span>
        </div>

        {visitors.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 space-y-2">
            <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <p>No active visitors online right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-white/[0.02] border-y border-zinc-200 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">User / Visitor</th>
                  <th className="px-6 py-3.5">Current Location</th>
                  <th className="px-6 py-3.5">Country</th>
                  <th className="px-6 py-3.5">Device</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04] text-zinc-900 dark:text-zinc-200 font-medium">
                {visitors.map((visitor, idx) => (
                  <tr key={visitor.presenceKey ? `${visitor.presenceKey}_${idx}` : `v_${visitor.sessionId}_${idx}`} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/console/users?search=${encodeURIComponent(visitor.userName || visitor.userEmail || "")}`}
                        className="flex items-center gap-3 group/user hover:opacity-80 transition-opacity"
                        title="View user details in User Directory"
                      >
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-md">
                          {visitor.userName ? visitor.userName.charAt(0) : "V"}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 group-hover/user:text-amber-500 transition-colors">
                            {visitor.userName}
                            {visitor.userId && (
                              <span title="Registered User">
                                <UserCheck className="h-3.5 w-3.5 text-emerald-400 inline" />
                              </span>
                            )}
                          </div>
                          {visitor.userEmail ? (
                            <div className="text-[10px] text-zinc-400 font-medium">{visitor.userEmail}</div>
                          ) : (
                            <div className="text-[10px] text-zinc-400 font-medium">Guest Visitor</div>
                          )}
                        </div>
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <a
                          href={visitor.pathname}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs font-bold text-amber-500 hover:underline inline-flex items-center gap-1"
                        >
                          {visitor.pathname}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[240px]">
                          {visitor.pageTitle}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                        <span className="text-lg">{visitor.flag}</span>
                        <span>{visitor.country}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                        {visitor.device === "Mobile" ? (
                          <Smartphone className="h-3.5 w-3.5" />
                        ) : (
                          <Laptop className="h-3.5 w-3.5" />
                        )}
                        <span className="font-medium">{visitor.device}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active Now
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Views Per Page Table (7d / 14d / 30d) */}
      <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm space-y-4">
        <div className="p-6 pb-0 flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-500" />
              Views Per Page ({timeRange === "7d" ? "Last 7 Days" : timeRange === "14d" ? "Last 14 Days" : "Last 30 Days"})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Historical view count and unique visitor breakdown by page path
            </p>
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.06] px-3 py-1 rounded-xl border border-zinc-200 dark:border-white/10">
            {pageViewStatsPeriod.length} Tracked Pages
          </span>
        </div>

        {pageViewStatsPeriod.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 space-y-1">
            <Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <p>No page view data recorded yet for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-white/[0.02] border-y border-zinc-200 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Page Path</th>
                  <th className="px-6 py-3.5">Page Title</th>
                  <th className="px-6 py-3.5">Total Views</th>
                  <th className="px-6 py-3.5">Unique Visitors</th>
                  <th className="px-6 py-3.5 text-right">% Traffic Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04] text-zinc-900 dark:text-zinc-200 font-medium">
                {pageViewStatsPeriod.map((item, idx) => {
                  const pct = totalViewsPeriod > 0 ? Math.round((item.views / totalViewsPeriod) * 100) : 0;
                  return (
                    <tr key={`${item.pathKey}_${idx}`} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5">
                        <a
                          href={item.pathname}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs font-bold text-amber-500 hover:underline inline-flex items-center gap-1"
                        >
                          {item.pathname}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </td>
                      <td className="px-6 py-3.5 text-zinc-500 dark:text-zinc-400 max-w-[260px] truncate">
                        {item.pageTitle}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-zinc-900 dark:text-white">
                        {item.views}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-purple-400">
                        {item.uniqueViews}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-zinc-900 dark:text-white">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-zinc-100 dark:bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW SECTION: TOP COUNTRIES VIEWS COME FROM (HISTORICAL TRAFFIC BREAKDOWN) */}
      <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm space-y-4">
        <div className="p-6 pb-0 flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-400" />
              Top Countries Views Come From ({timeRange === "7d" ? "Last 7 Days" : timeRange === "14d" ? "Last 14 Days" : "Last 30 Days"})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Historical country traffic breakdown and unique visitor distribution
            </p>
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.06] px-3 py-1 rounded-xl border border-zinc-200 dark:border-white/10">
            {countryTrafficPeriod.length} Countries Recorded
          </span>
        </div>

        {countryTrafficPeriod.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 space-y-1">
            <Globe className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <p>No historical country traffic recorded yet for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-white/[0.02] border-y border-zinc-200 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Country</th>
                  <th className="px-6 py-3.5">Country Code</th>
                  <th className="px-6 py-3.5">Total Page Views</th>
                  <th className="px-6 py-3.5">Unique Visitors</th>
                  <th className="px-6 py-3.5 text-right">% Traffic Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04] text-zinc-900 dark:text-zinc-200 font-medium">
                {countryTrafficPeriod.map((c, idx) => {
                  const pct = totalViewsPeriod > 0 ? Math.round((c.views / totalViewsPeriod) * 100) : 0;
                  return (
                    <tr
                      key={`${c.countryCode}_${idx}`}
                      onClick={() => setSelectedCountry(c.country)}
                      className="hover:bg-purple-500/5 dark:hover:bg-purple-500/10 cursor-pointer transition-colors group"
                      title={`Click to filter telemetry for ${c.country}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5 font-bold text-zinc-900 dark:text-white group-hover:text-purple-400 transition-colors">
                          <span className="text-xl">{c.flag}</span>
                          <span>{c.country}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                          {c.countryCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                        {c.views}
                      </td>
                      <td className="px-6 py-4 font-bold text-purple-400">
                        {c.uniqueVisitors}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-zinc-100 dark:bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span>{pct}%</span>
                        </div>
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

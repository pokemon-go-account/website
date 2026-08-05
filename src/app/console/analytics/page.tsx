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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

type TimeRange = "1d" | "7d" | "14d" | "30d" | "90d" | "all";

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

      // Deduplicate multi-tab visitors
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

    // Subscribe to historical analytics
    const analyticsRef = ref(db, "analytics");
    const unsubAnalytics = onValue(analyticsRef, (snapshot) => {
      setAnalyticsData(snapshot.val() || {});
    });

    return () => {
      unsubPresence();
      unsubAnalytics();
    };
  }, []);

  // Dynamically extract all known countries
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

  // Compute date array
  const dateList = useMemo(() => {
    if (timeRange === "all" && analyticsData) {
      const allDatesSet = new Set<string>();
      if (analyticsData.dailyViews) Object.keys(analyticsData.dailyViews).forEach((d) => allDatesSet.add(d));
      if (analyticsData.countryViews) Object.keys(analyticsData.countryViews).forEach((d) => allDatesSet.add(d));
      if (analyticsData.pageViews) Object.keys(analyticsData.pageViews).forEach((d) => allDatesSet.add(d));
      if (analyticsData.uniqueVisitors) Object.keys(analyticsData.uniqueVisitors).forEach((d) => allDatesSet.add(d));
      const sorted = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a));
      if (sorted.length > 0) return sorted;
    }

    const days =
      timeRange === "1d"
        ? 1
        : timeRange === "7d"
        ? 7
        : timeRange === "14d"
        ? 14
        : timeRange === "30d"
        ? 30
        : timeRange === "90d"
        ? 90
        : 365;

    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }, [timeRange, analyticsData]);

  // Filtered live visitors
  const filteredVisitors = useMemo(() => {
    if (selectedCountry === "ALL") return visitors;
    return visitors.filter((v) => (v.country || "").toLowerCase() === selectedCountry.toLowerCase());
  }, [visitors, selectedCountry]);

  // Aggregate Total Views & Unique Views over selected date range and country filter
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

      if (pageViews[dateStr]) {
        Object.entries(pageViews[dateStr]).forEach(([pKey, count]) => {
          const path = decodePathKey(pKey);
          const title = pageTitles[pKey] || path;
          const numCount = Number(count) || 0;

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

  // Realtime Live Page breakdown
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

  // Realtime Live Country breakdown
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
    <div className="space-y-8 max-w-6xl mx-auto pb-20 text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* 1. CLEAN STRIPE-STYLE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Web Analytics & Telemetry
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Presence
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Realtime visitor presence, page views, and geographic distribution.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Country Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="h-8 px-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="ALL">All Countries</option>
            {availableCountries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Time Range Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 flex-wrap">
            {[
              { key: "1d", label: "1 Day" },
              { key: "7d", label: "7 Days" },
              { key: "14d", label: "14 Days" },
              { key: "30d", label: "1 Month" },
              { key: "90d", label: "3 Months" },
              { key: "all", label: "All Time" },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setTimeRange(r.key as TimeRange)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer",
                  timeRange === r.key
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Country Filter Banner */}
      {selectedCountry !== "ALL" && (
        <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-md text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">
            Filtered country scope: <strong className="text-zinc-900 dark:text-white font-bold">{selectedCountry}</strong>
          </span>
          <button
            onClick={() => setSelectedCountry("ALL")}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* 2. MINIMAL SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Page Views ({timeRange})</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {totalViewsPeriod.toLocaleString()}
          </p>
          <span className="text-[11px] text-zinc-400 font-normal">Page hits recorded</span>
        </div>

        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Unique Visitors ({timeRange})</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {uniqueViewsPeriod.toLocaleString()}
          </p>
          <span className="text-[11px] text-zinc-400 font-normal">Unique devices</span>
        </div>

        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Online Right Now</span>
          <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            {visitors.length}
          </p>
          <span className="text-[11px] text-zinc-400 font-normal">Active sessions</span>
        </div>

        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tracked Pages</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {pageViewStatsPeriod.length}
          </p>
          <span className="text-[11px] text-zinc-400 font-normal">Distinct active routes</span>
        </div>

      </div>

      {/* 3. LIVE ACTIVE PAGES & LIVE COUNTRIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Pages */}
        <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              Currently Active Pages
            </h2>
            <span className="text-xs font-semibold text-zinc-500">{livePageStats.length} pages</span>
          </div>

          {livePageStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">No active page sessions right now</div>
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
                    className="relative group p-2.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 truncate max-w-[75%]">
                        <span className="font-mono text-xs text-purple-600 dark:text-purple-400 font-semibold truncate">
                          {item.pathname}
                        </span>
                        <span className="text-zinc-400 truncate">{item.pageTitle}</span>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {item.count} ({pct}%)
                      </span>
                    </div>

                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 dark:bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>

                    {isHovered && item.users.length > 0 && (
                      <div className="absolute left-0 top-full mt-1 z-30 w-64 bg-zinc-900 text-white rounded-md p-3 shadow-lg text-xs space-y-2 border border-zinc-800">
                        <div className="font-semibold text-zinc-300 border-b border-zinc-800 pb-1 flex justify-between">
                          <span>Active on {item.pathname}:</span>
                          <span className="font-bold">{item.users.length}</span>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1.5">
                          {item.users.map((u, uIdx) => (
                            <div key={u.presenceKey ? `${u.presenceKey}_${uIdx}` : `u_${uIdx}`} className="flex items-center justify-between text-[11px]">
                              <span className="truncate text-zinc-200 font-medium">{u.userName}</span>
                              <span className="text-zinc-400">{u.flag} {u.country}</span>
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

        {/* Active Countries */}
        <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              Active Countries Right Now
            </h2>
            <span className="text-xs font-semibold text-zinc-500">{liveCountryStats.length} countries</span>
          </div>

          {liveCountryStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">No active country locations right now</div>
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
                    className="relative group p-2.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.flag}</span>
                        <span className="font-semibold text-zinc-900 dark:text-white">{item.country}</span>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {item.count} ({pct}%)
                      </span>
                    </div>

                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 dark:bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>

                    {isHovered && item.users.length > 0 && (
                      <div className="absolute left-0 top-full mt-1 z-30 w-64 bg-zinc-900 text-white rounded-md p-3 shadow-lg text-xs space-y-2 border border-zinc-800">
                        <div className="font-semibold text-zinc-300 border-b border-zinc-800 pb-1 flex justify-between">
                          <span>{item.flag} Users from {item.country}:</span>
                          <span className="font-bold">{item.users.length}</span>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1.5">
                          {item.users.map((u, uIdx) => (
                            <div key={u.presenceKey ? `${u.presenceKey}_${uIdx}` : `u_${uIdx}`} className="flex items-center justify-between text-[11px]">
                              <span className="truncate text-zinc-200 font-medium">{u.userName}</span>
                              <span className="font-mono text-purple-300 truncate max-w-[100px]">{u.pathname}</span>
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

      {/* 4. LIVE ONLINE VISITORS STREAM TABLE */}
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              Live Visitor Stream ({visitors.length})
            </h2>
          </div>
        </div>

        {visitors.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No active visitors online right now.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium text-[11px]">
                <tr>
                  <th className="px-4 py-2.5">User / Visitor</th>
                  <th className="px-4 py-2.5">Current Route</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Device</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200">
                {visitors.map((v, idx) => (
                  <tr key={v.presenceKey ? `${v.presenceKey}_${idx}` : `v_${v.sessionId}_${idx}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/console/users?search=${encodeURIComponent(v.userName || v.userEmail || "")}`}
                        className="font-semibold text-zinc-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {v.userName} {v.userId && <UserCheck className="h-3 w-3 text-emerald-500 inline ml-1" />}
                      </Link>
                      {v.userEmail && <p className="text-[10px] text-zinc-400">{v.userEmail}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <a href={v.pathname} target="_blank" rel="noreferrer" className="font-mono text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                        {v.pathname}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="mr-1">{v.flag}</span>
                      <span className="font-medium">{v.country}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {v.device}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/20">
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

      {/* 5. HISTORICAL VIEWS PER PAGE TABLE */}
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
            Page View Telemetry ({timeRange === "7d" ? "7 Days" : timeRange === "14d" ? "14 Days" : "30 Days"})
          </h2>
          <span className="text-xs text-zinc-500">{pageViewStatsPeriod.length} pages tracked</span>
        </div>

        {pageViewStatsPeriod.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">No page view data for period.</div>
        ) : (
          <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium text-[11px]">
                <tr>
                  <th className="px-4 py-2.5">Route</th>
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">Total Hits</th>
                  <th className="px-4 py-2.5">Unique Visitors</th>
                  <th className="px-4 py-2.5 text-right">% Traffic Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200">
                {pageViewStatsPeriod.map((item, idx) => {
                  const pct = totalViewsPeriod > 0 ? Math.round((item.views / totalViewsPeriod) * 100) : 0;
                  return (
                    <tr key={`${item.pathKey}_${idx}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-purple-600 dark:text-purple-400">
                        <a href={item.pathname} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                          {item.pathname}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 truncate max-w-[220px]">
                        {item.pageTitle}
                      </td>
                      <td className="px-4 py-3 font-semibold font-mono">
                        {item.views.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold font-mono text-purple-600 dark:text-purple-400">
                        {item.uniqueViews.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-zinc-100 dark:bg-zinc-900 h-1 rounded-full overflow-hidden">
                            <div className="bg-[#6133e1] h-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono text-xs font-bold">{pct}%</span>
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

      {/* 6. COUNTRY-WISE HISTORICAL TRAFFIC TABLE */}
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              Country-Wise Traffic Telemetry ({timeRange === "7d" ? "7 Days" : timeRange === "14d" ? "14 Days" : "30 Days"})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Historical country traffic breakdown and unique visitor distribution. Click any row to filter.
            </p>
          </div>
          <span className="text-xs text-zinc-500">{countryTrafficPeriod.length} countries recorded</span>
        </div>

        {countryTrafficPeriod.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No historical country traffic recorded for specified period.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium text-[11px]">
                <tr>
                  <th className="px-4 py-2.5">Country</th>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Total Page Views</th>
                  <th className="px-4 py-2.5">Unique Visitors</th>
                  <th className="px-4 py-2.5 text-right">% Traffic Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200">
                {countryTrafficPeriod.map((c, idx) => {
                  const pct = totalViewsPeriod > 0 ? Math.round((c.views / totalViewsPeriod) * 100) : 0;
                  return (
                    <tr
                      key={`${c.countryCode}_${idx}`}
                      onClick={() => setSelectedCountry(c.country)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                      title={`Click to filter dashboard for ${c.country}`}
                    >
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                        <span className="mr-2 text-base">{c.flag}</span>
                        <span>{c.country}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-purple-600 dark:text-purple-400">
                        {c.countryCode}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        {c.views.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-purple-600 dark:text-purple-400">
                        {c.uniqueVisitors.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-zinc-100 dark:bg-zinc-900 h-1 rounded-full overflow-hidden">
                            <div className="bg-[#6133e1] h-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono text-xs font-bold">{pct}%</span>
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

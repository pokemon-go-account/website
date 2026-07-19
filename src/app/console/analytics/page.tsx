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
  TrendingUp
} from "lucide-react";

interface VisitorPresence {
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
            if (latestTab.lastSeen && now - latestTab.lastSeen < 120000) {
              activeList.push({
                ...v,
                pathname: latestTab.pathname || v.pathname || "/",
                pageTitle: latestTab.pageTitle || v.pageTitle || "/",
                lastSeen: latestTab.lastSeen || v.lastSeen,
              });
            }
          }
        } else if (v.lastSeen && now - v.lastSeen < 120000) {
          activeList.push(v);
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

  // Aggregate Total Views and Unique Views over selected date range
  const { totalViewsPeriod, uniqueViewsPeriod, pageViewStatsPeriod } = useMemo(() => {
    if (!analyticsData) {
      return { totalViewsPeriod: 0, uniqueViewsPeriod: 0, pageViewStatsPeriod: [] };
    }

    const dailyViews = analyticsData.dailyViews || {};
    const pageViews = analyticsData.pageViews || {};
    const pageTitles = analyticsData.pageTitles || {};
    const uniqueVisitors = analyticsData.uniqueVisitors || {};

    let totalViews = 0;
    const uniqueVisitorSet = new Set<string>();
    const pageMap = new Map<string, { pathKey: string; pathname: string; pageTitle: string; views: number; uniqueSet: Set<string> }>();

    dateList.forEach((dateStr) => {
      // Daily total views
      if (dailyViews[dateStr]) {
        totalViews += Number(dailyViews[dateStr]) || 0;
      }

      // Unique visitors per date
      if (uniqueVisitors[dateStr]) {
        Object.keys(uniqueVisitors[dateStr]).forEach((vId) => uniqueVisitorSet.add(vId));
      }

      // Page level views per date
      if (pageViews[dateStr]) {
        Object.entries(pageViews[dateStr]).forEach(([pKey, count]) => {
          const path = decodePathKey(pKey);
          const title = pageTitles[pKey] || path;
          const numCount = Number(count) || 0;

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

          // Count unique visitors for this page on this date
          if (uniqueVisitors[dateStr]) {
            Object.entries(uniqueVisitors[dateStr]).forEach(([vId, val]: [string, any]) => {
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

    return {
      totalViewsPeriod: totalViews,
      uniqueViewsPeriod: uniqueVisitorSet.size,
      pageViewStatsPeriod: pageStatsList,
    };
  }, [analyticsData, dateList]);

  // Realtime Live Page breakdown aggregation
  const livePageStats = useMemo(() => {
    const map = new Map<string, { pathname: string; pageTitle: string; count: number; users: VisitorPresence[] }>();
    visitors.forEach((v) => {
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
  }, [visitors]);

  // Realtime Live Country breakdown aggregation
  const liveCountryStats = useMemo(() => {
    const map = new Map<string, { country: string; flag: string; count: number; users: VisitorPresence[] }>();
    visitors.forEach((v) => {
      const country = v.country || "Global";
      const flag = v.flag || "🌐";
      const existing = map.get(country);
      if (existing) {
        existing.count += 1;
        existing.users.push(v);
      } else {
        map.set(country, { country, flag, count: 1, users: [v] });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [visitors]);

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Web Analytics & Traffic
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Direct WebSocket
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Realtime Presence & Page View Telemetry · 0 Vercel Fluid CPU Billing
          </p>
        </div>

        {/* Time Window Switcher */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/[0.04] p-1 rounded-xl border border-zinc-200 dark:border-white/[0.08]">
          <button
            onClick={() => setTimeRange("7d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeRange === "7d"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange("14d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeRange === "14d"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Last 14 Days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeRange === "30d"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views in Period */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Views ({timeRange})</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {totalViewsPeriod}
            </span>
            <span className="text-xs text-amber-500 font-medium flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> page hits
            </span>
          </div>
        </div>

        {/* Unique Views in Period */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Unique Visitors ({timeRange})</span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {uniqueViewsPeriod}
            </span>
            <span className="text-xs text-purple-500 font-medium">unique devices</span>
          </div>
        </div>

        {/* Online Right Now */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Online Right Now</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-500 tracking-tight">{visitors.length}</span>
            <span className="text-xs text-emerald-500 font-medium">active visitors</span>
          </div>
        </div>

        {/* Vercel Execution Metric */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Vercel Fluid CPU</span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">0.00 ms</span>
            <span className="text-xs text-zinc-400">0 serverless pings</span>
          </div>
        </div>
      </div>

    
      {/* Grid: Live Pages & Countries with User Hover Tooltips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Active Pages Breakdown */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Currently Active Pages</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Hover over any page to view active usernames right now</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 rounded-lg">
              {livePageStats.length} Pages
            </span>
          </div>

          

          {livePageStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">No active page sessions detected</div>
          ) : (
            <div className="space-y-3">
              {livePageStats.map((item) => {
                const pct = Math.round((item.count / visitors.length) * 100) || 0;
                const isHovered = hoveredPage === item.pathname;

                return (
                  <div
                    key={item.pathname}
                    onMouseEnter={() => setHoveredPage(item.pathname)}
                    onMouseLeave={() => setHoveredPage(null)}
                    className="relative group p-3 rounded-xl transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03] border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                      <div className="flex items-center gap-2 truncate max-w-[75%]">
                        <span className="font-mono text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-semibold shrink-0">
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
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Hover User Tooltip */}
                    {isHovered && item.users.length > 0 && (
                      <div className="absolute left-0 top-full mt-1 z-30 w-72 bg-zinc-900 text-white rounded-xl p-3 shadow-2xl border border-white/10 text-xs space-y-2">
                        <div className="font-semibold border-b border-white/10 pb-1 flex items-center justify-between">
                          <span>People on {item.pathname}:</span>
                          <span className="text-amber-400 font-mono">{item.users.length}</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                          {item.users.map((u, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                              <span className="font-medium text-zinc-200 truncate">{u.userName}</span>
                              <span className="text-[10px] text-zinc-400 ml-auto shrink-0">{u.flag} {u.country}</span>
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
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Active Countries</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Hover over any country to view active usernames right now</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 rounded-lg">
              {liveCountryStats.length} Countries
            </span>
          </div>

          {liveCountryStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">No active locations detected</div>
          ) : (
            <div className="space-y-3">
              {liveCountryStats.map((item) => {
                const pct = Math.round((item.count / visitors.length) * 100) || 0;
                const isHovered = hoveredCountry === item.country;

                return (
                  <div
                    key={item.country}
                    onMouseEnter={() => setHoveredCountry(item.country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    className="relative group p-3 rounded-xl transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03] border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.flag}</span>
                        <span className="text-zinc-900 dark:text-white font-semibold">{item.country}</span>
                      </div>
                      <span className="text-zinc-900 dark:text-white font-bold">
                        {item.count} {item.count === 1 ? "visitor" : "visitors"} ({pct}%)
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Hover User Tooltip */}
                    {isHovered && item.users.length > 0 && (
                      <div className="absolute left-0 top-full mt-1 z-30 w-72 bg-zinc-900 text-white rounded-xl p-3 shadow-2xl border border-white/10 text-xs space-y-2">
                        <div className="font-semibold border-b border-white/10 pb-1 flex items-center justify-between">
                          <span>{item.flag} Users from {item.country}:</span>
                          <span className="text-purple-400 font-mono">{item.users.length}</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                          {item.users.map((u, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                                <span className="font-medium text-zinc-200 truncate">{u.userName}</span>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-400 bg-white/10 px-1.5 py-0.5 rounded truncate max-w-[100px]">
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

      {/* Live Visitor Table */}
      <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-2xl overflow-hidden space-y-4">
        <div className="p-6 pb-0 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Live Online Visitors Stream
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live updating list of connected users & their current pages
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
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
              <thead className="bg-zinc-50 dark:bg-white/[0.02] border-y border-zinc-200 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">User / Visitor</th>
                  <th className="px-6 py-3">Current Location</th>
                  <th className="px-6 py-3">Country</th>
                  <th className="px-6 py-3">Device</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04] text-zinc-900 dark:text-zinc-200">
                {visitors.map((visitor) => (
                  <tr key={visitor.sessionId} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/console/users?search=${encodeURIComponent(visitor.userName || visitor.userEmail || "")}`}
                        className="flex items-center gap-3 group/user hover:opacity-80 transition-opacity"
                        title="View user details in User Directory"
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {visitor.userName ? visitor.userName.charAt(0) : "V"}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 group-hover/user:text-amber-500 transition-colors">
                            {visitor.userName}
                            {visitor.userId && (
                              <span title="Registered User">
                                <UserCheck className="h-3 w-3 text-emerald-500 inline" />
                              </span>
                            )}
                          </div>
                          {visitor.userEmail ? (
                            <div className="text-[10px] text-zinc-400">{visitor.userEmail}</div>
                          ) : (
                            <div className="text-[10px] text-zinc-400">Guest Visitor</div>
                          )}
                        </div>
                      </Link>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="space-y-0.5">
                        <a
                          href={visitor.pathname}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs font-semibold text-amber-500 hover:underline inline-flex items-center gap-1"
                        >
                          {visitor.pathname}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[240px]">
                          {visitor.pageTitle}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-base">{visitor.flag}</span>
                        <span>{visitor.country}</span>
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                        {visitor.device === "Mobile" ? (
                          <Smartphone className="h-3.5 w-3.5" />
                        ) : (
                          <Laptop className="h-3.5 w-3.5" />
                        )}
                        <span>{visitor.device}</span>
                      </div>
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
      <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-2xl overflow-hidden space-y-4">
        <div className="p-6 pb-0 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-500" />
              Views Per Page ({timeRange === "7d" ? "Last 7 Days" : timeRange === "14d" ? "Last 14 Days" : "Last 30 Days"})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Historical view count and unique visitor breakdown by page path
            </p>
          </div>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/[0.06] px-3 py-1 rounded-lg">
            {pageViewStatsPeriod.length} Tracked Pages
          </span>
        </div>

        {pageViewStatsPeriod.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 space-y-1">
            <Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <p>No page view data recorded yet for the selected period.</p>
            <p className="text-[11px] text-zinc-500">Visit any page on the storefront to record view counts!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-white/[0.02] border-y border-zinc-200 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Page Path</th>
                  <th className="px-6 py-3">Page Title</th>
                  <th className="px-6 py-3">Total Views</th>
                  <th className="px-6 py-3">Unique Visitors</th>
                  <th className="px-6 py-3 text-right">% Traffic Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04] text-zinc-900 dark:text-zinc-200">
                {pageViewStatsPeriod.map((item) => {
                  const pct = totalViewsPeriod > 0 ? Math.round((item.views / totalViewsPeriod) * 100) : 0;
                  return (
                    <tr key={item.pathKey} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5">
                        <a
                          href={item.pathname}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs font-semibold text-amber-500 hover:underline inline-flex items-center gap-1"
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
                      <td className="px-6 py-3.5 font-semibold text-purple-400">
                        {item.uniqueViews}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-zinc-900 dark:text-white">
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

    </div>
  );
}

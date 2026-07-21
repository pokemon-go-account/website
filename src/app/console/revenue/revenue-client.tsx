"use client";

import { useEffect, useState, useMemo } from "react";
import { getRevenueAnalyticsAction, DailyStat, RevenueOrderDetails } from "@/features/analytics/revenue-actions";
import { getLiveExchangeRates } from "@/features/store/currency-actions";
import {
  TrendingUp as TrendingIcon,
  DollarSign as DollarIcon,
  ShoppingBag as OrderIcon,
  BarChart3 as ChartIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  RefreshCw as RefreshIcon,
  Globe as GlobeIcon,
  Loader2 as Spinner,
  Calendar as CalendarIcon,
  Layers as LayersIcon,
  ArrowUpRight as ArrowIcon,
  Gavel as AuctionIcon,
  KeyRound as RecoveryIcon,
  CreditCard as PaymentIcon,
  MapPin as MapPinIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "INR", symbol: "₹", label: "INR (₹)" },
  { code: "JPY", symbol: "¥", label: "JPY (¥)" },
];

interface RevenueData {
  summary: {
    totalRevenueUSD: number;
    totalOrdersCount: number;
    averageOrderValueUSD: number;
    storefrontRevenueUSD: number;
    buyNowRevenueUSD: number;
    auctionRevenueUSD: number;
    recoveryRevenueUSD: number;
  };
  dailyStats: DailyStat[];
  orders: RevenueOrderDetails[];
}

interface RevenueClientProps {
  initialData?: RevenueData;
  initialRates?: Record<string, number>;
}

export function RevenueClient({ initialData, initialRates }: RevenueClientProps) {
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<RevenueData | null>(initialData || null);

  const [rates, setRates] = useState<Record<string, number>>(initialRates || { USD: 1.0 });
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [chartMode, setChartMode] = useState<"revenue" | "orders">("revenue");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [hoveredBar, setHoveredBar] = useState<DailyStat | null>(null);

  // 1. Fetch Revenue Data & MongoDB Cached Rates
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [revRes, rateRes] = await Promise.all([
        getRevenueAnalyticsAction(),
        getLiveExchangeRates(),
      ]);

      if (revRes.success && revRes.data) {
        setData(revRes.data);
      }
      if (rateRes.success && rateRes.rates) {
        setRates(rateRes.rates);
      }
    } catch (err) {
      console.error("Error loading revenue data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [initialData]);

  // Helper to convert USD value to selected currency
  const currRate = rates[selectedCurrency] || 1.0;
  const currSymbol = CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol || "$";

  const convertPrice = (usdAmount: number) => {
    const val = (usdAmount || 0) * currRate;
    if (selectedCurrency === "JPY" || selectedCurrency === "INR") {
      return `${currSymbol}${Math.round(val).toLocaleString()}`;
    }
    return `${currSymbol}${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Extract list of unique available countries from orders
  const availableCountries = useMemo(() => {
    if (!data?.orders) return [];
    const set = new Set<string>();
    data.orders.forEach((ord) => {
      if (ord.customerCountry && ord.customerCountry.trim()) {
        set.add(ord.customerCountry.trim());
      }
    });
    return Array.from(set).sort();
  }, [data?.orders]);

  // Filtered orders list by search query, order type, and country
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    return data.orders.filter((ord) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ord.customerCountry || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "ALL" || ord.orderType === typeFilter;
      const matchesCountry =
        selectedCountry === "ALL" ||
        (ord.customerCountry || "").toLowerCase() === selectedCountry.toLowerCase();
      return matchesSearch && matchesType && matchesCountry;
    });
  }, [data?.orders, searchQuery, typeFilter, selectedCountry]);

  // Re-calculate summary metrics dynamically when country filter is applied
  const summary = useMemo(() => {
    if (!data?.summary) {
      return {
        totalRevenueUSD: 0,
        totalOrdersCount: 0,
        averageOrderValueUSD: 0,
        storefrontRevenueUSD: 0,
        buyNowRevenueUSD: 0,
        auctionRevenueUSD: 0,
        recoveryRevenueUSD: 0,
      };
    }

    if (selectedCountry === "ALL") {
      return data.summary;
    }

    let totalRevenueUSD = 0;
    let storefrontRevenueUSD = 0;
    let buyNowRevenueUSD = 0;
    let auctionRevenueUSD = 0;
    let recoveryRevenueUSD = 0;

    filteredOrders.forEach((ord) => {
      const amt = ord.totalPriceUSD || 0;
      totalRevenueUSD += amt;
      if (ord.orderType === "STOREFRONT") storefrontRevenueUSD += amt;
      else if (ord.orderType === "BUY_NOW") buyNowRevenueUSD += amt;
      else if (ord.orderType === "AUCTION") auctionRevenueUSD += amt;
      else if (ord.orderType === "RECOVERY") recoveryRevenueUSD += amt;
    });

    const totalOrdersCount = filteredOrders.length;
    const averageOrderValueUSD = totalOrdersCount > 0 ? totalRevenueUSD / totalOrdersCount : 0;

    return {
      totalRevenueUSD: Math.round(totalRevenueUSD * 100) / 100,
      totalOrdersCount,
      averageOrderValueUSD: Math.round(averageOrderValueUSD * 100) / 100,
      storefrontRevenueUSD: Math.round(storefrontRevenueUSD * 100) / 100,
      buyNowRevenueUSD: Math.round(buyNowRevenueUSD * 100) / 100,
      auctionRevenueUSD: Math.round(auctionRevenueUSD * 100) / 100,
      recoveryRevenueUSD: Math.round(recoveryRevenueUSD * 100) / 100,
    };
  }, [data?.summary, filteredOrders, selectedCountry]);

  // Re-calculate daily stats for 14-day chart dynamically when country filter is active
  const dailyStats = useMemo(() => {
    if (selectedCountry === "ALL" && data?.dailyStats) {
      return data.dailyStats;
    }

    const dailyMap = new Map<string, { count: number; revenue: number }>();
    filteredOrders.forEach((ord) => {
      const d = new Date(ord.createdAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
      const existing = dailyMap.get(key) || { count: 0, revenue: 0 };
      dailyMap.set(key, { count: existing.count + 1, revenue: existing.revenue + ord.totalPriceUSD });
    });

    const stats: DailyStat[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
      const stat = dailyMap.get(key) || { count: 0, revenue: 0 };
      const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      stats.push({
        date: key,
        formattedDate,
        ordersCount: stat.count,
        revenue: Math.round(stat.revenue * 100) / 100,
      });
    }
    return stats;
  }, [data?.dailyStats, filteredOrders, selectedCountry]);

  // Daily Stats maximum value for SVG chart scaling
  const maxChartValue = useMemo(() => {
    if (!dailyStats || dailyStats.length === 0) return 100;
    if (chartMode === "revenue") {
      const maxRev = Math.max(...dailyStats.map((s) => s.revenue));
      return maxRev > 0 ? maxRev : 100;
    } else {
      const maxOrd = Math.max(...dailyStats.map((s) => s.ordersCount));
      return maxOrd > 0 ? maxOrd : 10;
    }
  }, [dailyStats, chartMode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner className="h-8 w-8 animate-spin text-[#6133e1]" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading Revenue & Exchange Rates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-20">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] p-6 rounded-3xl backdrop-blur-xl shadow-sm relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#6133e1]/10 text-[#6133e1] dark:text-violet-400 flex items-center justify-center border border-[#6133e1]/20">
              <TrendingIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                Revenue & Daily Order Analytics
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Live performance dashboard · Multi-currency rate cache via MongoDB
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS: Country, Currency Selector & Refresh */}
        <div className="flex items-center gap-3 z-10 flex-wrap">
          {/* Country Filter Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-[#181820] border border-zinc-200 dark:border-white/[0.08] px-3 py-1.5 rounded-2xl shadow-xs">
            <GlobeIcon className="h-4 w-4 text-purple-400 shrink-0" />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Country:</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-900 dark:text-white outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-white dark:bg-[#181820] text-zinc-900 dark:text-white">🌐 All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c} className="bg-white dark:bg-[#181820] text-zinc-900 dark:text-white">
                  📍 {c}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-[#181820] border border-zinc-200 dark:border-white/[0.08] px-3 py-1.5 rounded-2xl shadow-xs">
            <DollarIcon className="h-4 w-4 text-[#6133e1] shrink-0" />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Currency:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-900 dark:text-white outline-none cursor-pointer pr-1"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-white dark:bg-[#181820] text-zinc-900 dark:text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="h-9 px-3.5 rounded-2xl bg-[#6133e1] hover:bg-[#5028c7] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <RefreshIcon className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Active Country Filter Banner */}
      {selectedCountry !== "ALL" && (
        <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 px-5 py-3 rounded-2xl text-xs font-bold text-purple-300 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-purple-400 shrink-0" />
            <span>Filtering Revenue Dashboard for Country: <strong className="text-white font-extrabold">{selectedCountry}</strong></span>
          </div>
          <button
            onClick={() => setSelectedCountry("ALL")}
            className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-white text-[11px] font-extrabold transition-colors cursor-pointer"
          >
            Clear Country Filter
          </button>
        </div>
      )}

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-[#6133e1]/40 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Revenue</span>
            <div className="h-10 w-10 rounded-xl bg-[#6133e1]/10 text-[#6133e1] dark:text-violet-400 flex items-center justify-center border border-[#6133e1]/20">
              <DollarIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {convertPrice(summary.totalRevenueUSD)}
            </span>
            <p className="text-[11px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
              <ArrowIcon className="h-3 w-3" /> All completed orders
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/40 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Orders</span>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <OrderIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {summary.totalOrdersCount}
            </span>
            <p className="text-[11px] text-zinc-400 font-medium mt-1">Paid storefront & custom requests</p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Avg Order Value (AOV)</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <TrendingIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {convertPrice(summary.averageOrderValueUSD)}
            </span>
            <p className="text-[11px] text-emerald-500 font-bold mt-1">Revenue per order average</p>
          </div>
        </div>

        {/* Per-Day Orders Average */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Daily Avg Orders</span>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <ChartIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {(summary.totalOrdersCount / 14).toFixed(1)} / day
            </span>
            <p className="text-[11px] text-amber-500 font-bold mt-1">14-day average volume</p>
          </div>
        </div>

      </div>

      {/* INTERACTIVE DAILY ORDERS & REVENUE CHART */}
      <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <ChartIcon className="h-4 w-4 text-[#6133e1]" />
              Per-Day Order & Revenue Breakdown (14 Days)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Hover over bars to inspect detailed daily order volume and converted revenue
            </p>
          </div>

          {/* Toggle: Revenue vs Orders */}
          <div className="p-1 rounded-xl bg-zinc-100 dark:bg-[#181820] border border-zinc-200 dark:border-white/[0.06] flex gap-1 self-start sm:self-auto">
            <button
              onClick={() => setChartMode("revenue")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                chartMode === "revenue"
                  ? "bg-white dark:bg-[#22222c] text-[#6133e1] dark:text-white shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              Daily Revenue
            </button>
            <button
              onClick={() => setChartMode("orders")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                chartMode === "orders"
                  ? "bg-white dark:bg-[#22222c] text-[#6133e1] dark:text-white shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              Per-Day Orders
            </button>
          </div>
        </div>

        {/* SVG Bar Chart Visualization */}
        <div className="relative pt-6 pb-2">
          {hoveredBar && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs px-3 py-1.5 rounded-xl font-semibold shadow-lg border border-zinc-800 dark:border-zinc-200 z-20 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
              <span className="font-bold">{hoveredBar.formattedDate}:</span>
              <span>{hoveredBar.ordersCount} order(s)</span>
              <span className="font-bold text-emerald-400 dark:text-emerald-600">({convertPrice(hoveredBar.revenue)})</span>
            </div>
          )}

          <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-3 px-2">
            {dailyStats.map((stat, idx) => {
              const val = chartMode === "revenue" ? stat.revenue : stat.ordersCount;
              const heightPct = maxChartValue > 0 ? Math.max(8, Math.round((val / maxChartValue) * 100)) : 8;

              return (
                <div
                  key={stat.date}
                  onMouseEnter={() => setHoveredBar(stat)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                >
                  <div className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold truncate">
                    {chartMode === "revenue" ? convertPrice(stat.revenue) : `${stat.ordersCount} orders`}
                  </div>

                  <div className="w-full bg-zinc-100 dark:bg-white/[0.04] rounded-t-xl h-full flex items-end p-0.5 overflow-hidden">
                    <div
                      className={cn(
                        "w-full rounded-t-lg transition-all duration-300 group-hover:brightness-110",
                        chartMode === "revenue"
                          ? "bg-gradient-to-t from-[#6133e1] to-[#8b5cf6]"
                          : "bg-gradient-to-t from-blue-600 to-indigo-400"
                      )}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                    {stat.formattedDate}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* REVENUE BREAKDOWN BY ORDER TYPE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Storefront */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
            <span>Storefront Sales</span>
            <OrderIcon className="h-4 w-4 text-[#6133e1]" />
          </div>
          <p className="text-xl font-black text-zinc-900 dark:text-white">
            {convertPrice(summary.storefrontRevenueUSD)}
          </p>
        </div>

        {/* Auctions */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
            <span>Auctions Revenue</span>
            <AuctionIcon className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-zinc-900 dark:text-white">
            {convertPrice(summary.auctionRevenueUSD)}
          </p>
        </div>

        {/* Buy Now */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
            <span>Buy Now Sales</span>
            <PaymentIcon className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-zinc-900 dark:text-white">
            {convertPrice(summary.buyNowRevenueUSD)}
          </p>
        </div>

        {/* Recovery Requests */}
        <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
            <span>Account Recovery</span>
            <RecoveryIcon className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-zinc-900 dark:text-white">
            {convertPrice(summary.recoveryRevenueUSD)}
          </p>
        </div>

      </div>

      {/* ORDER DETAILS TABLE */}
      <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-xs space-y-4">
        
        {/* Table Filters & Search Bar */}
        <div className="p-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <OrderIcon className="h-4 w-4 text-[#6133e1]" />
              Order Details ({filteredOrders.length})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Completed transactions with auto-converted currency prices
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order # or user..."
                className="pl-9 pr-4 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#181820] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-[#6133e1]"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#181820] border border-zinc-200 dark:border-white/[0.08] px-3 py-1.5 rounded-xl text-xs">
              <FilterIcon className="h-3.5 w-3.5 text-zinc-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-white dark:bg-[#181820]">All Types</option>
                <option value="STOREFRONT" className="bg-white dark:bg-[#181820]">Storefront</option>
                <option value="BUY_NOW" className="bg-white dark:bg-[#181820]">Buy Now</option>
                <option value="AUCTION" className="bg-white dark:bg-[#181820]">Auction</option>
                <option value="RECOVERY" className="bg-white dark:bg-[#181820]">Recovery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400 space-y-1">
            <OrderIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <p>No completed orders found matching the filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-white/[0.02] border-y border-zinc-200 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items Purchased</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Price ({selectedCurrency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04] text-zinc-900 dark:text-zinc-200 font-medium">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#6133e1]">
                      {ord.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white leading-tight">{ord.customerName}</p>
                        <p className="text-[10px] text-zinc-400">{ord.customerEmail}</p>
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold">
                          <GlobeIcon className="h-2.5 w-2.5 shrink-0" />
                          <span>{ord.customerCountry || "Location Unspecified"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="space-y-1">
                        {ord.items && ord.items.length > 0 ? (
                          ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs">
                              <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[200px]" title={item.name}>
                                {item.name}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 shrink-0">
                                x{item.quantity}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-zinc-400 italic">Storefront Product</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                        ord.orderType === "RECOVERY"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : ord.orderType === "AUCTION"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : ord.orderType === "BUY_NOW"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-[#6133e1]/10 text-[#6133e1] dark:text-violet-400 border-[#6133e1]/20"
                      )}>
                        {ord.orderType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {new Date(ord.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-zinc-900 dark:text-white">
                      {convertPrice(ord.totalPriceUSD)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}

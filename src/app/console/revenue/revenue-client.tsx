"use client";

import { useEffect, useState, useMemo } from "react";
import { getRevenueAnalyticsAction, DailyStat, RevenueOrderDetails } from "@/features/analytics/revenue-actions";
import { getLiveExchangeRates } from "@/features/store/currency-actions";
import {
  Search as SearchIcon,
  Filter as FilterIcon,
  RefreshCw as RefreshIcon,
  Globe as GlobeIcon,
  Loader2 as Spinner,
  Download as DownloadIcon,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  BarChart2,
  ChevronLeft,
  ChevronRight,
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch Revenue Data & MongoDB Cached Rates
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

  // Currency converter helper
  const currRate = rates[selectedCurrency] || 1.0;
  const currSymbol = CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol || "$";

  const convertPrice = (usdAmount: number) => {
    const val = (usdAmount || 0) * currRate;
    if (selectedCurrency === "JPY" || selectedCurrency === "INR") {
      return `${currSymbol}${Math.round(val).toLocaleString()}`;
    }
    return `${currSymbol}${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Available countries
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

  // Filtered orders list
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

  // Paginated Orders
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

  // Summary calculation
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

  // Channel Revenue Percentages
  const channelPercents = useMemo(() => {
    const total = summary.totalRevenueUSD || 1;
    return {
      storefront: Math.round(((summary.storefrontRevenueUSD || 0) / total) * 100),
      auctions: Math.round(((summary.auctionRevenueUSD || 0) / total) * 100),
      buyNow: Math.round(((summary.buyNowRevenueUSD || 0) / total) * 100),
      recovery: Math.round(((summary.recoveryRevenueUSD || 0) / total) * 100),
    };
  }, [summary]);

  // Daily Stats for 14 days chart
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

  // CSV Export Handler
  const exportToCSV = () => {
    if (!filteredOrders || filteredOrders.length === 0) return;
    const headers = ["Order Number", "Customer Name", "Customer Email", "Country", "Order Type", "Items", "Price USD", "Date"];
    const rows = filteredOrders.map((ord) => [
      `"${(ord.orderNumber || "").replace(/"/g, '""')}"`,
      `"${(ord.customerName || "").replace(/"/g, '""')}"`,
      `"${(ord.customerEmail || "").replace(/"/g, '""')}"`,
      `"${(ord.customerCountry || "Unspecified").replace(/"/g, '""')}"`,
      `"${(ord.orderType || "").replace(/"/g, '""')}"`,
      `"${(ord.items || []).map((i) => `${i.name} (x${i.quantity})`).join("; ").replace(/"/g, '""')}"`,
      ord.totalPriceUSD || 0,
      `"${new Date(ord.createdAt).toISOString()}"`,
    ]);

    const csvString = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `revenue_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-zinc-500 font-medium">
        <Spinner className="h-4 w-4 animate-spin mr-2 text-zinc-400" />
        Loading analytics dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* 1. PROFESSIONAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Revenue Analytics & Reporting
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Financial performance oversight, daily order velocity, and multi-currency conversion ledger.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Country Filter */}
          <select
            value={selectedCountry}
            onChange={(e) => { setSelectedCountry(e.target.value); setCurrentPage(1); }}
            className="h-8 px-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="ALL">All Countries</option>
            {availableCountries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Currency Switcher */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="h-8 px-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={exportToCSV}
            className="h-8 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export CSV Report"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Refresh Action */}
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshIcon className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            <span>Refresh</span>
          </button>

        </div>
      </div>

      {/* Country Filter Banner */}
      {selectedCountry !== "ALL" && (
        <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-md text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">
            Filtered Country Scope: <strong className="text-zinc-900 dark:text-white font-bold">{selectedCountry}</strong>
          </span>
          <button
            onClick={() => setSelectedCountry("ALL")}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* 2. EXECUTIVE FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Gross Revenue</span>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {convertPrice(summary.totalRevenueUSD)}
          </p>
          <span className="text-[11px] text-zinc-400 font-normal">Total processed sales</span>
        </div>

        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Orders Completed</span>
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {summary.totalOrdersCount}
          </p>
          <span className="text-[11px] text-zinc-400 font-normal">Storefront & live auctions</span>
        </div>

        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Average Order Value</span>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {convertPrice(summary.averageOrderValueUSD)}
          </p>
          <span className="text-[11px] text-zinc-400 font-normal">Average customer spend</span>
        </div>

        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Daily Sales Pace</span>
            <BarChart2 className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {(summary.totalOrdersCount / 14).toFixed(1)} <span className="text-xs text-zinc-500 font-sans font-normal">/ day</span>
          </p>
          <span className="text-[11px] text-zinc-400 font-normal">14-day average</span>
        </div>

      </div>

      {/* 3. 14-DAY PERFORMANCE CHART */}
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-5">
        
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              14-Day Sales & Order Velocity
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setChartMode("revenue")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer",
                chartMode === "revenue"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              Revenue
            </button>
            <button
              onClick={() => setChartMode("orders")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer",
                chartMode === "orders"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              Orders
            </button>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className="relative pt-4 pb-2">
          {hoveredBar && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[11px] px-3 py-1 rounded-md font-medium shadow-md z-20 flex items-center gap-2">
              <span>{hoveredBar.formattedDate}:</span>
              <span>{hoveredBar.ordersCount} orders</span>
              <span className="text-emerald-400 font-bold">({convertPrice(hoveredBar.revenue)})</span>
            </div>
          )}

          <div className="h-48 w-full flex items-end justify-between gap-2 px-1">
            {dailyStats.map((stat) => {
              const val = chartMode === "revenue" ? stat.revenue : stat.ordersCount;
              const heightPct = maxChartValue > 0 ? Math.max(8, Math.round((val / maxChartValue) * 100)) : 8;

              return (
                <div
                  key={stat.date}
                  onMouseEnter={() => setHoveredBar(stat)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                >
                  <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-t h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-zinc-900 dark:bg-zinc-100 rounded-t transition-all group-hover:bg-[#6133e1] dark:group-hover:bg-purple-400"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-medium text-zinc-400 truncate">
                    {stat.formattedDate}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. REVENUE CONTRIBUTION BY CHANNEL */}
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-900 pb-3">
          Channel Revenue Contribution
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-md border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Storefront Catalog</span>
            <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
              {convertPrice(summary.storefrontRevenueUSD)}
            </p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#6133e1] h-full" style={{ width: `${channelPercents.storefront}%` }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">{channelPercents.storefront}% of revenue</span>
          </div>

          <div className="p-4 rounded-md border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Live Auctions</span>
            <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
              {convertPrice(summary.auctionRevenueUSD)}
            </p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${channelPercents.auctions}%` }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">{channelPercents.auctions}% of revenue</span>
          </div>

          <div className="p-4 rounded-md border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Buy Now Accounts</span>
            <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
              {convertPrice(summary.buyNowRevenueUSD)}
            </p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${channelPercents.buyNow}%` }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">{channelPercents.buyNow}% of revenue</span>
          </div>

          <div className="p-4 rounded-md border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Account Recovery</span>
            <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
              {convertPrice(summary.recoveryRevenueUSD)}
            </p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${channelPercents.recovery}%` }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">{channelPercents.recovery}% of revenue</span>
          </div>
        </div>
      </div>

      {/* 5. TRANSACTION LEDGER WITH PAGINATION */}
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              Transaction Ledger ({filteredOrders.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search order ID or customer..."
                className="pl-8 pr-3 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="h-7 px-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-800 dark:text-zinc-200 font-medium outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="STOREFRONT">Storefront</option>
              <option value="BUY_NOW">Buy Now</option>
              <option value="AUCTION">Auction</option>
              <option value="RECOVERY">Recovery</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No orders match the specified filter.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Order ID</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Country</th>
                    <th className="px-4 py-2.5">Items</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right">Price ({selectedCurrency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200">
                  {paginatedOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-purple-600 dark:text-purple-400">
                        {ord.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-white leading-tight">{ord.customerName}</p>
                          <p className="text-[10px] text-zinc-400">{ord.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 font-medium">
                        {ord.customerCountry || "Unspecified"}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="truncate text-xs">
                          {ord.items && ord.items.length > 0 ? (
                            ord.items.map((i) => i.name).join(", ")
                          ) : (
                            <span className="text-zinc-400 italic">Storefront Product</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] font-semibold">
                          {ord.orderType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {new Date(ord.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900 dark:text-white">
                        {convertPrice(ord.totalPriceUSD)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 px-1">
                <span>
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-colors disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-2 text-zinc-700 dark:text-zinc-300 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-colors disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}

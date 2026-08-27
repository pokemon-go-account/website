"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { getRevenueAnalyticsAction, DailyStat, RevenueOrderDetails } from "@/features/analytics/revenue-actions";
import { getLiveExchangeRates } from "@/features/store/currency-actions";
import { OrderInvestmentModal } from "@/components/console/order-investment-modal";
import { OrderContextMenu, ContextMenuPosition } from "@/components/console/order-context-menu";
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
  LineChart,
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
    totalInvestmentUSD?: number;
    netProfitUSD?: number;
    totalOrdersCount: number;
    averageOrderValueUSD: number;
    storefrontRevenueUSD: number;
    buyNowRevenueUSD: number;
    auctionRevenueUSD: number;
    recoveryRevenueUSD: number;
    registrationRevenueUSD: number;
  };
  dailyStats: DailyStat[];
  orders: RevenueOrderDetails[];
}

interface RevenueClientProps {
  initialData?: RevenueData;
  initialRates?: Record<string, number>;
}

function RevenueLineChart({
  dailyStats,
  maxChartValue,
  chartMode,
  convertPrice,
  hoveredBar,
  setHoveredBar,
}: {
  dailyStats: DailyStat[];
  maxChartValue: number;
  chartMode: "revenue" | "orders";
  convertPrice: (val: number) => string;
  hoveredBar: DailyStat | null;
  setHoveredBar: (bar: DailyStat | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const width = 1000;
  const height = 220;
  const paddingTop = 25;
  const paddingBottom = 40;
  const paddingLeft = 30;
  const paddingRight = 30;
  const graphHeight = height - paddingTop - paddingBottom;
  const graphWidth = width - paddingLeft - paddingRight;

  const points = useMemo(() => {
    if (!dailyStats || dailyStats.length === 0) return [];
    const count = dailyStats.length;
    return dailyStats.map((stat, i) => {
      const x = count > 1 ? paddingLeft + (i / (count - 1)) * graphWidth : width / 2;
      const val = chartMode === "revenue" ? stat.revenue : stat.ordersCount;
      const pct = maxChartValue > 0 ? val / maxChartValue : 0;
      const y = height - paddingBottom - pct * graphHeight;
      return { x, y, stat, val };
    });
  }, [dailyStats, maxChartValue, chartMode, graphWidth, graphHeight]);

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    const bottomY = (height - paddingBottom).toFixed(1);
    return `${pathD} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [pathD, points]);

  const labelIndices = useMemo(() => {
    if (points.length <= 10) return points.map((_, i) => i);
    const step = Math.ceil(points.length / 8);
    const indices: number[] = [];
    for (let i = 0; i < points.length; i += step) {
      indices.push(i);
    }
    if (indices[indices.length - 1] !== points.length - 1) {
      indices.push(points.length - 1);
    }
    return indices;
  }, [points]);

  const activePoint = points.find((p) => p.stat.date === hoveredBar?.date);

  const lineColor = chartMode === "revenue" ? "#a855f7" : "#10b981";
  const gradientId = chartMode === "revenue" ? "revGrad" : "ordGrad";
  const colWidth = points.length > 1 ? graphWidth / (points.length - 1) : graphWidth;

  // Pointer/Touch tracking across the SVG for smooth mobile dragging & tapping
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!points.length || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const svgX = (touchX / rect.width) * width;

    let closest = points[0];
    let minDistance = Math.abs(svgX - points[0].x);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(svgX - points[i].x);
      if (dist < minDistance) {
        minDistance = dist;
        closest = points[i];
      }
    }
    setHoveredBar(closest.stat);
  };

  return (
    <div className="relative w-full pt-2 pb-1 select-none">
      {/* Floating Hover Tooltip (Desktop) */}
      {activePoint && (
        <div
          className="hidden sm:flex absolute -top-1 bg-zinc-900 text-white text-[11px] px-3 py-1.5 rounded-md font-medium shadow-xl z-30 items-center gap-2 border border-zinc-700 pointer-events-none transition-all"
          style={{
            left: `${Math.max(10, Math.min(90, (activePoint.x / width) * 100))}%`,
            transform: "translateX(-50%)",
          }}
        >
          <span className="font-bold text-zinc-300">{activePoint.stat.formattedDate}:</span>
          <span className="text-zinc-200">{activePoint.stat.ordersCount} orders</span>
          <span className="text-emerald-400 font-bold">({convertPrice(activePoint.stat.revenue)})</span>
        </div>
      )}

      <div className="w-full overflow-x-auto touch-pan-x">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[320px] sm:min-w-[500px] overflow-visible touch-none"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/60" strokeDasharray="3 3" strokeWidth="1" />
          <line x1={paddingLeft} y1={paddingTop + graphHeight / 2} x2={width - paddingRight} y2={paddingTop + graphHeight / 2} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/60" strokeDasharray="3 3" strokeWidth="1" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" />

          {/* Area Fill */}
          {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

          {/* Main Smooth Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={lineColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Active Vertical Guide Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={paddingTop}
              x2={activePoint.x}
              y2={height - paddingBottom}
              stroke={lineColor}
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Data Point Column Hit Targets & Circles */}
          {points.map((p) => {
            const isHovered = activePoint?.stat.date === p.stat.date;
            const showDot = points.length <= 35 || isHovered;

            return (
              <g
                key={p.stat.date}
                className="cursor-pointer"
                onClick={() => setHoveredBar(isHovered ? null : p.stat)}
                onMouseEnter={() => setHoveredBar(p.stat)}
              >
                {/* Full Height Column Touch Hit Rectangle */}
                <rect
                  x={p.x - colWidth / 2}
                  y={paddingTop}
                  width={colWidth}
                  height={graphHeight + paddingBottom}
                  fill="transparent"
                />
                {showDot && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? "7" : "3.5"}
                    fill={isHovered ? "#ffffff" : lineColor}
                    stroke={lineColor}
                    strokeWidth={isHovered ? "3" : "1.5"}
                    className="transition-all duration-150"
                  />
                )}
              </g>
            );
          })}

          {/* X-Axis Date Labels */}
          {labelIndices.map((idx) => {
            const p = points[idx];
            if (!p) return null;
            return (
              <text
                key={p.stat.date}
                x={p.x}
                y={height - 12}
                textAnchor="middle"
                className="text-[11px] font-medium fill-zinc-400 dark:fill-zinc-500"
              >
                {p.stat.formattedDate}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Active Point Mobile/Desktop Indicator Banner */}
      <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
        {activePoint ? (
          <div className="flex items-center justify-between bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30 px-3.5 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">{activePoint.stat.formattedDate}</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{activePoint.stat.ordersCount} orders</span>
            </div>
            <div className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">
              {convertPrice(activePoint.stat.revenue)}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-zinc-400 italic text-center py-1">
            Tap or drag across graph points to view details
          </div>
        )}
      </div>
    </div>
  );
}

export function RevenueClient({ initialData, initialRates }: RevenueClientProps) {
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<RevenueData | null>(initialData || null);

  const [rates, setRates] = useState<Record<string, number>>(initialRates || { USD: 1.0 });
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState<"1d" | "7d" | "14d" | "30d" | "90d" | "all">("14d");
  const [chartMode, setChartMode] = useState<"revenue" | "orders">("revenue");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [hoveredBar, setHoveredBar] = useState<DailyStat | null>(null);

  // Context Menu & Investment Modal State
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [selectedOrderForInvestment, setSelectedOrderForInvestment] = useState<any | null>(null);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);

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
    if (initialData) {
      setData(initialData);
    } else {
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

      let matchesType = false;
      if (typeFilter === "ALL") {
        matchesType = true;
      } else if (typeFilter.startsWith("CAT_")) {
        const catKey = typeFilter.replace("CAT_", "").toLowerCase();
        const itemNamesStr = (ord.items || []).map((i) => (i.name || "").toLowerCase()).join(" ");
        const catSlugsStr = (ord.items || []).map((i) => (i.categorySlug || "").toLowerCase()).join(" ");
        const catNamesStr = (ord.items || []).map((i) => (i.categoryName || "").toLowerCase()).join(" ");

        if (catKey === "pokemons") {
          matchesType =
            catSlugsStr.includes("pokemon") ||
            catNamesStr.includes("pokemon") ||
            itemNamesStr.includes("pokemon") ||
            itemNamesStr.includes("shiny") ||
            itemNamesStr.includes("mewtwo") ||
            itemNamesStr.includes("kyogre") ||
            itemNamesStr.includes("rayquaza") ||
            itemNamesStr.includes("necrozma") ||
            itemNamesStr.includes("armored");
        } else if (catKey === "coins") {
          matchesType =
            catSlugsStr.includes("coin") ||
            catNamesStr.includes("coin") ||
            itemNamesStr.includes("coin") ||
            itemNamesStr.includes("pokecoin");
        } else if (catKey === "stardust") {
          matchesType =
            catSlugsStr.includes("stardust") ||
            catNamesStr.includes("stardust") ||
            itemNamesStr.includes("stardust");
        } else if (catKey === "accounts") {
          matchesType =
            catSlugsStr.includes("account") ||
            catNamesStr.includes("account") ||
            itemNamesStr.includes("account");
        } else if (catKey === "xp") {
          matchesType =
            catSlugsStr.includes("xp") ||
            catNamesStr.includes("xp") ||
            itemNamesStr.includes("xp");
        } else if (catKey === "items") {
          matchesType =
            catSlugsStr.includes("item") ||
            catNamesStr.includes("item") ||
            itemNamesStr.includes("item") ||
            itemNamesStr.includes("pass") ||
            itemNamesStr.includes("ticket");
        } else if (catKey === "raids") {
          matchesType =
            catSlugsStr.includes("raid") ||
            catNamesStr.includes("raid") ||
            itemNamesStr.includes("raid");
        } else {
          matchesType = itemNamesStr.includes(catKey) || catSlugsStr.includes(catKey);
        }
      } else {
        matchesType = ord.orderType === typeFilter;
      }

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
        totalInvestmentUSD: 0,
        netProfitUSD: 0,
        totalOrdersCount: 0,
        averageOrderValueUSD: 0,
        storefrontRevenueUSD: 0,
        buyNowRevenueUSD: 0,
        auctionRevenueUSD: 0,
        recoveryRevenueUSD: 0,
        registrationRevenueUSD: 0,
      };
    }

    if (selectedCountry === "ALL") {
      return data.summary;
    }

    let totalRevenueUSD = 0;
    let totalInvestmentUSD = 0;
    let storefrontRevenueUSD = 0;
    let buyNowRevenueUSD = 0;
    let auctionRevenueUSD = 0;
    let recoveryRevenueUSD = 0;
    let registrationRevenueUSD = 0;

    filteredOrders.forEach((ord) => {
      const amt = ord.totalPriceUSD || 0;
      totalRevenueUSD += amt;
      totalInvestmentUSD += (ord.investmentAmount || 0);
      if (ord.orderType === "STOREFRONT") storefrontRevenueUSD += amt;
      else if (ord.orderType === "BUY_NOW") buyNowRevenueUSD += amt;
      else if (ord.orderType === "AUCTION") auctionRevenueUSD += amt;
      else if (ord.orderType === "RECOVERY") recoveryRevenueUSD += amt;
      else if (ord.orderType === "REGISTRATION") registrationRevenueUSD += amt;
    });

    const totalOrdersCount = filteredOrders.length;
    const averageOrderValueUSD = totalOrdersCount > 0 ? totalRevenueUSD / totalOrdersCount : 0;

    return {
      totalRevenueUSD: Math.round(totalRevenueUSD * 100) / 100,
      totalInvestmentUSD: Math.round(totalInvestmentUSD * 100) / 100,
      netProfitUSD: Math.round((totalRevenueUSD - totalInvestmentUSD) * 100) / 100,
      totalOrdersCount,
      averageOrderValueUSD: Math.round(averageOrderValueUSD * 100) / 100,
      storefrontRevenueUSD: Math.round(storefrontRevenueUSD * 100) / 100,
      buyNowRevenueUSD: Math.round(buyNowRevenueUSD * 100) / 100,
      auctionRevenueUSD: Math.round(auctionRevenueUSD * 100) / 100,
      recoveryRevenueUSD: Math.round(recoveryRevenueUSD * 100) / 100,
      registrationRevenueUSD: Math.round(registrationRevenueUSD * 100) / 100,
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
      registration: Math.round(((summary.registrationRevenueUSD || 0) / total) * 100),
    };
  }, [summary]);

  // Full Daily Stats array from filter or database
  const fullDailyStats = useMemo(() => {
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
    const startDate = new Date("2026-07-15T00:00:00Z");
    const today = new Date();
    const curr = new Date(startDate);

    while (curr <= today) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, "0");
      const day = String(curr.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
      const stat = dailyMap.get(key) || { count: 0, revenue: 0 };
      const formattedDate = curr.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      stats.push({
        date: key,
        formattedDate,
        ordersCount: stat.count,
        revenue: Math.round(stat.revenue * 100) / 100,
      });
      curr.setDate(curr.getDate() + 1);
    }
    return stats;
  }, [data?.dailyStats, filteredOrders, selectedCountry]);

  // Active Daily or Hourly Stats based on selected timeRange
  const dailyStats = useMemo(() => {
    if (timeRange === "1d") {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const hourlyMap = new Map<string, { count: number; revenue: number; label: string }>();

      // Pre-fill 24 hourly buckets (from 23 hours ago up to current hour)
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourNum = d.getHours();
        const hourLabel = `${String(hourNum).padStart(2, "0")}:00`;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}_${String(hourNum).padStart(2, "0")}`;
        hourlyMap.set(key, { count: 0, revenue: 0, label: hourLabel });
      }

      filteredOrders.forEach((ord) => {
        const ordDate = new Date(ord.createdAt);
        if (ordDate >= twentyFourHoursAgo) {
          const hourNum = ordDate.getHours();
          const key = `${ordDate.getFullYear()}-${String(ordDate.getMonth() + 1).padStart(2, "0")}-${String(ordDate.getDate()).padStart(2, "0")}_${String(hourNum).padStart(2, "0")}`;
          const existing = hourlyMap.get(key);
          if (existing) {
            existing.count += 1;
            existing.revenue += (ord.totalPriceUSD || 0);
          }
        }
      });

      const stats: DailyStat[] = Array.from(hourlyMap.entries()).map(([key, val]) => ({
        date: key,
        formattedDate: val.label,
        ordersCount: val.count,
        revenue: Math.round(val.revenue * 100) / 100,
      }));

      return stats;
    }

    let daysToKeep = 14;
    if (timeRange === "7d") daysToKeep = 7;
    else if (timeRange === "14d") daysToKeep = 14;
    else if (timeRange === "30d") daysToKeep = 30;
    else if (timeRange === "90d") daysToKeep = 90;
    else if (timeRange === "all") daysToKeep = fullDailyStats.length;

    return fullDailyStats.slice(-daysToKeep);
  }, [fullDailyStats, filteredOrders, timeRange]);

  const timeRangeLabel = useMemo(() => {
    switch (timeRange) {
      case "1d": return "24-Hour";
      case "7d": return "7-Day";
      case "14d": return "14-Day";
      case "30d": return "1-Month";
      case "90d": return "3-Month";
      case "all": return "All-Time";
      default: return "14-Day";
    }
  }, [timeRange]);

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
    const headers = ["Order Number", "Customer Name", "Customer Email", "Country", "Order Type", "Items", "Price USD", "Investment", "Date"];
    const rows = filteredOrders.map((ord) => [
      `"${(ord.orderNumber || "").replace(/"/g, '""')}"`,
      `"${(ord.customerName || "").replace(/"/g, '""')}"`,
      `"${(ord.customerEmail || "").replace(/"/g, '""')}"`,
      `"${(ord.customerCountry || "Unspecified").replace(/"/g, '""')}"`,
      `"${(ord.orderType || "").replace(/"/g, '""')}"`,
      `"${(ord.items || []).map((i) => `${i.name} (x${i.quantity})`).join("; ").replace(/"/g, '""')}"`,
      ord.totalPriceUSD || 0,
      ord.investmentAmount || 0,
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

  const activeOrdersCountInPeriod = dailyStats.reduce((acc, s) => acc + s.ordersCount, 0);

  const handleRowContextMenu = (e: React.MouseEvent, ord: any) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      order: ord,
    });
  };

  const handleOpenInvestmentModal = (ord: any) => {
    setSelectedOrderForInvestment(ord);
    setIsInvestmentModalOpen(true);
  };

  const handleInvestmentSaved = (orderId: string, investmentAmount: number, investmentBy: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const updatedOrders = prev.orders.map((o) =>
        o.id === orderId ? { ...o, investmentAmount, investmentBy } : o
      );
      const newTotalInv = updatedOrders.reduce((sum, o) => sum + (o.investmentAmount || 0), 0);
      const newNetProfit = prev.summary.totalRevenueUSD - newTotalInv;
      return {
        ...prev,
        summary: {
          ...prev.summary,
          totalInvestmentUSD: newTotalInv,
          netProfitUSD: newNetProfit,
        },
        orders: updatedOrders,
      };
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-20 text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* 1. PROFESSIONAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Revenue Analytics & Reporting
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Financial performance oversight, daily order velocity, and multi-currency conversion ledger.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          
          {/* Country Filter */}
          <select
            value={selectedCountry}
            onChange={(e) => { setSelectedCountry(e.target.value); setCurrentPage(1); }}
            className="h-9 sm:h-8 px-3 rounded-xl sm:rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer w-full"
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
            className="h-9 sm:h-8 px-3 rounded-xl sm:rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer w-full"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={exportToCSV}
            className="h-9 sm:h-8 px-3 rounded-xl sm:rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
            title="Export CSV Report"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Refresh Action */}
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="h-9 sm:h-8 px-3 rounded-xl sm:rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto"
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

      {/* 2. SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="p-3.5 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1.5 sm:space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Total Revenue</span>
            <DollarSign className="h-4 w-4 text-[#6133e1]" />
          </div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {convertPrice(summary.totalRevenueUSD)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-zinc-400 font-normal">Total processed sales</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/[0.03] space-y-1.5 sm:space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
            <span>Total Investment</span>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
            {convertPrice(summary.totalInvestmentUSD || 0)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-amber-500/70 font-normal">Sourcing & product cost</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/[0.03] space-y-1.5 sm:space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Net Profit</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            {convertPrice(summary.netProfitUSD ?? summary.totalRevenueUSD)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-emerald-500/70 font-normal">Revenue minus investment</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1.5 sm:space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Orders Completed</span>
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {summary.totalOrdersCount}
          </p>
          <span className="text-[10px] sm:text-[11px] text-zinc-400 font-normal">Orders & entry fees</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1.5 sm:space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Avg Order Value</span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {convertPrice(summary.averageOrderValueUSD)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-zinc-400 font-normal">Average customer spend</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1.5 sm:space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>{timeRange === "1d" ? "Hourly Pace" : "Daily Pace"}</span>
            <LineChart className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
            {timeRange === "1d"
              ? (activeOrdersCountInPeriod / 24).toFixed(1)
              : (activeOrdersCountInPeriod / (dailyStats.length || 1)).toFixed(1)}{" "}
            <span className="text-xs text-zinc-500 font-sans font-normal">
              {timeRange === "1d" ? "/ hr" : "/ day"}
            </span>
          </p>
          <span className="text-[10px] sm:text-[11px] text-zinc-400 font-normal">{timeRangeLabel} average</span>
        </div>

      </div>

      {/* 3. PERFORMANCE CHART (LINE GRAPH) */}
      <div className="p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 sm:space-y-5 shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              {timeRangeLabel} Sales & Order Velocity
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Financial performance & order velocity line breakdown over {timeRangeLabel.toLowerCase()} timeframe.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Range Selector */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-w-full">
              {[
                { key: "1d", label: "1D" },
                { key: "7d", label: "7D" },
                { key: "14d", label: "14D" },
                { key: "30d", label: "1M" },
                { key: "90d", label: "3M" },
                { key: "all", label: "All" },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setTimeRange(r.key as any)}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded transition-colors cursor-pointer shrink-0",
                    timeRange === r.key
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Metric Mode Toggle */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
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
        </div>

        {/* Line Chart Visualizer */}
        <RevenueLineChart
          dailyStats={dailyStats}
          maxChartValue={maxChartValue}
          chartMode={chartMode}
          convertPrice={convertPrice}
          hoveredBar={hoveredBar}
          setHoveredBar={setHoveredBar}
        />

      </div>

      {/* 4. REVENUE CONTRIBUTION BY CHANNEL */}
      <div className="p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-900 pb-3">
          Channel Revenue Contribution
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-1 sm:space-y-1.5">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500">Storefront</span>
            <p className="text-base sm:text-lg font-bold font-mono text-zinc-900 dark:text-white">
              {convertPrice(summary.storefrontRevenueUSD)}
            </p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#6133e1] h-full" style={{ width: `${channelPercents.storefront}%` }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">{channelPercents.storefront}% of revenue</span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-1 sm:space-y-1.5">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500">Auctions</span>
            <p className="text-base sm:text-lg font-bold font-mono text-zinc-900 dark:text-white">
              {convertPrice(summary.auctionRevenueUSD)}
            </p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${channelPercents.auctions}%` }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">{channelPercents.auctions}% of revenue</span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-1 sm:space-y-1.5">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500">Buy Now</span>
            <p className="text-base sm:text-lg font-bold font-mono text-zinc-900 dark:text-white">
              {convertPrice(summary.buyNowRevenueUSD)}
            </p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${channelPercents.buyNow}%` }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">{channelPercents.buyNow}% of revenue</span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-1 sm:space-y-1.5">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500">Recovery</span>
            <p className="text-base sm:text-lg font-bold font-mono text-zinc-900 dark:text-white">
              {convertPrice(summary.recoveryRevenueUSD)}
            </p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${channelPercents.recovery}%` }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">{channelPercents.recovery}% of revenue</span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 space-y-1 sm:space-y-1.5 col-span-2 sm:col-span-1">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-500">Registrations</span>
            <p className="text-base sm:text-lg font-bold font-mono text-zinc-900 dark:text-white">
              {convertPrice(summary.registrationRevenueUSD || 0)}
            </p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full" style={{ width: `${channelPercents.registration}%` }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">{channelPercents.registration}% of revenue</span>
          </div>
        </div>
      </div>

      {/* 5. TRANSACTION LEDGER WITH PAGINATION */}
      <div className="p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              Transaction Ledger ({filteredOrders.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search order ID or customer..."
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 sm:py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-md text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-auto h-9 sm:h-7 px-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-md text-xs text-zinc-800 dark:text-zinc-200 font-medium outline-none cursor-pointer"
            >
              <option value="ALL">All Types & Categories</option>
              <optgroup label="Order Types">
                <option value="STOREFRONT">Storefront</option>
                <option value="BUY_NOW">Buy Now</option>
                <option value="AUCTION">Auction</option>
                <option value="RECOVERY">Recovery</option>
                <option value="REGISTRATION">Registration Fees</option>
              </optgroup>
              <optgroup label="Product Categories">
                <option value="CAT_POKEMONS">✨ Pokemons</option>
                <option value="CAT_COINS">🪙 Pokecoins / Coins</option>
                <option value="CAT_STARDUST">⭐ Stardust</option>
                <option value="CAT_ACCOUNTS">🎮 Accounts</option>
                <option value="CAT_XP">⚡ XP Service</option>
                <option value="CAT_ITEMS">🎒 Items & Passes</option>
                <option value="CAT_RAIDS">🗡️ Raid Services</option>
              </optgroup>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No orders match the specified filter.
          </div>
        ) : (
          <div className="space-y-3">

            {/* Mobile Native Transaction Cards (Visible on mobile screens < md) */}
            <div className="block md:hidden space-y-3">
              {paginatedOrders.map((ord) => {
                const isReg = ord.orderType === "REGISTRATION";
                const isAuc = ord.orderType === "AUCTION";
                const isBuy = ord.orderType === "BUY_NOW";
                const isRec = ord.orderType === "RECOVERY";

                return (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider border",
                          isReg && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                          isAuc && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                          isBuy && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                          isRec && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                          !isReg && !isAuc && !isBuy && !isRec && "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                        )}
                      >
                        {ord.orderType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{ord.customerName}</p>
                        <p className="text-[10px] text-zinc-400">{ord.customerEmail}</p>
                      </div>
                      <div className="text-right font-mono font-black text-sm text-zinc-900 dark:text-white">
                        {convertPrice(ord.totalPriceUSD)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                      <div className="truncate max-w-[180px]">
                        {ord.items && ord.items.length > 0
                          ? ord.items.map((i) => i.name).join(", ")
                          : "Storefront Product"}
                      </div>
                      <div className="font-mono text-[10px] shrink-0">
                        {new Date(ord.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Full Data Table (Visible on screens >= md) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Order ID</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Country</th>
                    <th className="px-4 py-2.5">Items</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Investment / By</th>
                    <th className="px-4 py-2.5 text-right">Net Profit</th>
                    <th className="px-4 py-2.5 text-right">Revenue ({selectedCurrency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200">
                  {paginatedOrders.map((ord) => {
                    const inv = ord.investmentAmount || 0;
                    const profit = ord.totalPriceUSD - inv;

                    return (
                      <tr
                        key={ord.id}
                        onContextMenu={(e) => handleRowContextMenu(e, ord)}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors cursor-context-menu"
                      >
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
                        {/* Investment & Investment By */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleOpenInvestmentModal(ord)}
                            className="text-left font-mono hover:underline group cursor-pointer"
                            title="Right click or click to edit investment details"
                          >
                            <span className="font-bold text-amber-500 block text-xs">
                              {convertPrice(inv)}
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-sans">
                              {ord.investmentBy ? `By: ${ord.investmentBy}` : "+ Add Investment"}
                            </span>
                          </button>
                        </td>
                        {/* Net Profit */}
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          <span className={profit >= 0 ? "text-emerald-500" : "text-red-500"}>
                            {convertPrice(profit)}
                          </span>
                        </td>
                        {/* Revenue */}
                        <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900 dark:text-white">
                          {convertPrice(ord.totalPriceUSD)}
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Right-click Context Menu */}
      <OrderContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onEditInvestment={(ord) => handleOpenInvestmentModal(ord)}
      />

      {/* Edit Investment Modal */}
      <OrderInvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => {
          setIsInvestmentModalOpen(false);
          setSelectedOrderForInvestment(null);
        }}
        order={selectedOrderForInvestment}
        onSaved={handleInvestmentSaved}
      />
    </div>
  );
}

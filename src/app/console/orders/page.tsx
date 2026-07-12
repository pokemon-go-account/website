"use client";

import { useState, useEffect } from "react";
import {
  getOrdersConsole,
  completeOrderConsole,
  failOrderConsole,
  deleteOrderConsole
} from "@/features/console/actions";
import { ShoppingBag, Check, X, Trash2, Search, CheckCircle, AlertTriangle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "@/components/price-display";

interface OrderData {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
    telegramUsername?: string;
  };
  items: Array<{
    productId?: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  orderType: "STOREFRONT" | "BUY_NOW" | "AUCTION";
  createdAt: string;
}

export default function OrdersConsolePage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "COMPLETED" | "FAILED">("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ text: string; ok: boolean } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await getOrdersConsole();
    if (res.success && res.orders) {
      setOrders(res.orders);
    } else {
      setAlert({ text: res.error || "Failed to load orders.", ok: false });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleComplete = async (id: string) => {
    setProcessingId(id);
    setAlert(null);
    const res = await completeOrderConsole(id);
    if (res.success) {
      setAlert({ text: "Order marked as COMPLETED successfully.", ok: true });
      loadData();
    } else {
      setAlert({ text: res.error || "Action failed.", ok: false });
    }
    setProcessingId(null);
  };

  const handleFail = async (id: string) => {
    setProcessingId(id);
    setAlert(null);
    const res = await failOrderConsole(id);
    if (res.success) {
      setAlert({ text: "Order marked as FAILED.", ok: true });
      loadData();
    } else {
      setAlert({ text: res.error || "Action failed.", ok: false });
    }
    setProcessingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this order document?")) return;
    setProcessingId(id);
    setAlert(null);
    const res = await deleteOrderConsole(id);
    if (res.success) {
      setAlert({ text: "Order deleted successfully.", ok: true });
      loadData();
    } else {
      setAlert({ text: res.error || "Delete failed.", ok: false });
    }
    setProcessingId(null);
  };

  // Filtering & Search
  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === "ALL" || order.status === activeTab;
    const matchesQuery =
      !searchQuery.trim() ||
      order.userId?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userId?._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesQuery;
  });

  return (
    <div className="max-w-6xl space-y-8">
      {/* Title */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Orders Manager</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Approve and track direct storefront checkouts and Buy Now transactions.</p>
      </div>

      {/* Alerts */}
      {alert && (
        <div
          className={cn(
            "rounded-md border p-3 text-xs flex items-center gap-2",
            alert.ok
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450"
              : "border-red-500/20 bg-red-500/5 text-red-400"
          )}
        >
          {alert.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {alert.text}
        </div>
      )}

      {/* Search and Tabs Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Pills */}
        <div className="flex border border-zinc-200 dark:border-white/[0.06] bg-zinc-100/50 dark:bg-white/[0.02] p-1 rounded-md gap-1">
          {(["ALL", "PENDING", "COMPLETED", "FAILED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "h-7 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer",
                activeTab === tab
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by buyer username, product name..."
            className="w-full h-8 pl-9 pr-4 bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white text-xs placeholder:text-zinc-450 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="border border-zinc-200 dark:border-white/[0.06] rounded-lg overflow-hidden bg-white dark:bg-[#111111] shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/[0.06] text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Buyer Profile</th>
                <th className="px-6 py-4">Ordered Items</th>
                <th className="px-6 py-4">Order Value & Type</th>
                <th className="px-6 py-4">Order Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.05] text-zinc-700 dark:text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">
                    Loading orders registry...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic font-medium">
                    No orders found matching parameters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors"
                    >
                      {/* Buyer Details */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white">
                          {order.userId?.name || "Unnamed Trainer"}
                        </div>
                        <div className="text-zinc-500 font-mono text-[10px]">
                          @{order.userId?.username || "no_username"}
                        </div>
                        <div className="text-zinc-450 dark:text-zinc-500 font-mono text-[9px] select-all leading-none my-0.5">
                          Order ID: {order._id}
                        </div>
                        {order.userId?._id && (
                          <div className="text-zinc-450 dark:text-zinc-500 font-mono text-[9px] select-all leading-none mb-1">
                            User ID: {order.userId._id}
                          </div>
                        )}
                        <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                          {order.userId?.email}
                        </div>
                        {order.userId?.telegramUsername && (
                          <div className="text-[#24A1DE] text-[9px] font-semibold flex items-center gap-0.5 mt-0.5">
                            <MessageSquare className="h-2.5 w-2.5" /> {order.userId.telegramUsername}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="px-6 py-4 max-w-[250px] space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="font-semibold text-zinc-900 dark:text-white leading-normal">
                            {item.name} <span className="text-zinc-400 font-normal text-[10px]">x{item.quantity}</span>
                          </div>
                        ))}
                      </td>

                      {/* Price & Type */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-zinc-900 dark:text-white text-xs block">
                          <PriceDisplay amountInUSD={order.totalPrice} />
                        </span>
                        <span
                          className={cn(
                            "inline-block px-1.5 py-0.2 rounded text-[8px] font-bold border mt-1 uppercase tracking-wider",
                            order.orderType === "STOREFRONT"
                              ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          )}
                        >
                          {order.orderType === "STOREFRONT" ? "STORE" : order.orderType}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-zinc-500 font-mono">
                        {orderDate}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider",
                            order.status === "COMPLETED" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                            order.status === "PENDING" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                            order.status === "FAILED" && "border-red-500/30 bg-red-500/10 text-red-400"
                          )}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleComplete(order._id)}
                              disabled={processingId === order._id}
                              className="h-7 w-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                              title="Mark Completed"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {order.status === "PENDING" && (
                            <button
                              onClick={() => handleFail(order._id)}
                              disabled={processingId === order._id}
                              className="h-7 w-7 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.05] text-zinc-650 dark:text-zinc-450 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                              title="Mark Failed"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(order._id)}
                            disabled={processingId === order._id}
                            className="h-7 w-7 rounded-lg bg-red-600/80 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                            title="Delete Order"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

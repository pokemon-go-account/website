"use server";

import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import RecoveryRequest from "@/models/RecoveryRequest";
import { auth } from "@/auth";

export interface DailyStat {
  date: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "Jul 20"
  ordersCount: number;
  revenue: number;
}

export interface RevenueOrderItem {
  name: string;
  priceUSD: number;
  quantity: number;
}

export interface RevenueOrderDetails {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderType: "STOREFRONT" | "BUY_NOW" | "AUCTION" | "RECOVERY";
  status: string;
  totalPriceUSD: number;
  itemsCount: number;
  items: RevenueOrderItem[];
  createdAt: string;
}

export async function getRevenueAnalyticsAction() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized access. Super Admin required." };
    }

    await connectDB();

    // Fetch all completed/paid orders
    const orders = await Order.find({ status: "COMPLETED" })
      .populate("userId", "username name email")
      .sort({ createdAt: -1 })
      .lean();

    // Also fetch completed recovery requests (if any not represented in Order)
    const completedRecoveries = await RecoveryRequest.find({ status: "COMPLETED" })
      .populate("userId", "username name email")
      .sort({ createdAt: -1 })
      .lean();

    let totalRevenueUSD = 0;
    let storefrontRevenueUSD = 0;
    let buyNowRevenueUSD = 0;
    let auctionRevenueUSD = 0;
    let recoveryRevenueUSD = 0;

    const dailyMap = new Map<string, { count: number; revenue: number }>();
    const orderList: RevenueOrderDetails[] = [];

    // Helper to format date key YYYY-MM-DD
    const getDateKey = (date: Date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Process Orders
    for (const ord of orders) {
      const amount = ord.totalPrice || 0;
      totalRevenueUSD += amount;

      const type = ord.orderType || "STOREFRONT";
      if (type === "STOREFRONT") storefrontRevenueUSD += amount;
      else if (type === "BUY_NOW") buyNowRevenueUSD += amount;
      else if (type === "AUCTION") auctionRevenueUSD += amount;
      else if (type === "RECOVERY") recoveryRevenueUSD += amount;

      const dateKey = getDateKey(ord.createdAt);
      const existing = dailyMap.get(dateKey) || { count: 0, revenue: 0 };
      dailyMap.set(dateKey, {
        count: existing.count + 1,
        revenue: existing.revenue + amount,
      });

      const userObj = ord.userId as any;
      const itemsList: RevenueOrderItem[] = (ord.items || []).map((i: any) => ({
        name: i.name || "Purchased Product",
        priceUSD: i.price || 0,
        quantity: i.quantity || 1,
      }));

      orderList.push({
        id: ord._id.toString(),
        orderNumber: `#ORD-${ord._id.toString().substring(18, 24).toUpperCase()}`,
        customerName: userObj?.username || userObj?.name || "Customer",
        customerEmail: userObj?.email || "No email",
        orderType: type,
        status: ord.status,
        totalPriceUSD: amount,
        itemsCount: itemsList.length,
        items: itemsList,
        createdAt: new Date(ord.createdAt).toISOString(),
      });
    }

    // Process completed recovery requests if priced
    for (const rec of completedRecoveries) {
      const price = rec.price || 0;
      if (price > 0 && !orders.some((o) => o.items?.some((i: any) => i.productId?.toString() === rec._id.toString()))) {
        totalRevenueUSD += price;
        recoveryRevenueUSD += price;

        const dateKey = getDateKey(rec.createdAt);
        const existing = dailyMap.get(dateKey) || { count: 0, revenue: 0 };
        dailyMap.set(dateKey, {
          count: existing.count + 1,
          revenue: existing.revenue + price,
        });

        const userObj = rec.userId as any;
        const itemsList: RevenueOrderItem[] = [
          {
            name: `Account Recovery (Level ${rec.accountLevel || "N/A"})`,
            priceUSD: price,
            quantity: 1,
          },
        ];

        orderList.push({
          id: rec._id.toString(),
          orderNumber: `#REC-${rec._id.toString().substring(18, 24).toUpperCase()}`,
          customerName: userObj?.username || userObj?.name || "Customer",
          customerEmail: userObj?.email || "No email",
          orderType: "RECOVERY",
          status: "COMPLETED",
          totalPriceUSD: price,
          itemsCount: 1,
          items: itemsList,
          createdAt: new Date(rec.createdAt).toISOString(),
        });
      }
    }

    // Build last 14 days stats array for smooth daily orders chart
    const dailyStats: DailyStat[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const stat = dailyMap.get(key) || { count: 0, revenue: 0 };
      const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyStats.push({
        date: key,
        formattedDate,
        ordersCount: stat.count,
        revenue: Math.round(stat.revenue * 100) / 100,
      });
    }

    const totalOrdersCount = orderList.length;
    const averageOrderValueUSD = totalOrdersCount > 0 ? totalRevenueUSD / totalOrdersCount : 0;

    return {
      success: true,
      data: {
        summary: {
          totalRevenueUSD: Math.round(totalRevenueUSD * 100) / 100,
          totalOrdersCount,
          averageOrderValueUSD: Math.round(averageOrderValueUSD * 100) / 100,
          storefrontRevenueUSD: Math.round(storefrontRevenueUSD * 100) / 100,
          buyNowRevenueUSD: Math.round(buyNowRevenueUSD * 100) / 100,
          auctionRevenueUSD: Math.round(auctionRevenueUSD * 100) / 100,
          recoveryRevenueUSD: Math.round(recoveryRevenueUSD * 100) / 100,
        },
        dailyStats,
        orders: orderList,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch revenue analytics:", error);
    return { success: false, error: error.message || "Failed to fetch revenue analytics." };
  }
}

"use server";

import mongoose from "mongoose";
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
  customerCountry?: string;
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

    // 1. Calculate all-time summary stats using database-level aggregates
    const orderStats = await Order.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 },
          storefront: {
            $sum: { $cond: [{ $eq: ["$orderType", "STOREFRONT"] }, "$totalPrice", 0] }
          },
          buyNow: {
            $sum: { $cond: [{ $eq: ["$orderType", "BUY_NOW"] }, "$totalPrice", 0] }
          },
          auction: {
            $sum: { $cond: [{ $eq: ["$orderType", "AUCTION"] }, "$totalPrice", 0] }
          },
          recovery: {
            $sum: { $cond: [{ $eq: ["$orderType", "RECOVERY"] }, "$totalPrice", 0] }
          }
        }
      }
    ]);

    const orderStatResult = orderStats[0] || {
      total: 0,
      count: 0,
      storefront: 0,
      buyNow: 0,
      auction: 0,
      recovery: 0
    };

    // Find all recovery request IDs paid via a completed order to prevent double-counting
    const recoveryOrders = await Order.find({
      status: "COMPLETED",
      orderType: "RECOVERY"
    }).select("items.productId items.recoveryRequestId").lean();

    const orderRecoveryIds = new Set<string>();
    for (const ord of recoveryOrders) {
      for (const i of (ord.items || [])) {
        const id = (i as any).recoveryRequestId || i.productId;
        if (id) {
          orderRecoveryIds.add(id.toString());
        }
      }
    }

    // Calculate completed recoveries revenue that was paid through channels other than standard Storefront orders
    const independentRecoveries = await RecoveryRequest.find({
      status: "COMPLETED",
      price: { $gt: 0 },
      _id: { $nin: Array.from(orderRecoveryIds).map(id => new mongoose.Types.ObjectId(id)) }
    }).select("price");

    let independentRecoveryRevenue = 0;
    for (const rec of independentRecoveries) {
      independentRecoveryRevenue += rec.price || 0;
    }

    const totalOrdersCount = orderStatResult.count + independentRecoveries.length;
    const storefrontRevenueUSD = orderStatResult.storefront;
    const buyNowRevenueUSD = orderStatResult.buyNow;
    const auctionRevenueUSD = orderStatResult.auction;
    const recoveryRevenueUSD = orderStatResult.recovery + independentRecoveryRevenue;
    const totalRevenueUSD = storefrontRevenueUSD + buyNowRevenueUSD + auctionRevenueUSD + recoveryRevenueUSD;
    const averageOrderValueUSD = totalOrdersCount > 0 ? totalRevenueUSD / totalOrdersCount : 0;

    // 2. Fetch recent completed orders & recoveries for the last 14 days chart (Avoids loading all history)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const [recentOrders, recentRecoveries] = await Promise.all([
      Order.find({
        status: "COMPLETED",
        createdAt: { $gte: fourteenDaysAgo }
      }).select("totalPrice createdAt"),
      RecoveryRequest.find({
        status: "COMPLETED",
        price: { $gt: 0 },
        createdAt: { $gte: fourteenDaysAgo }
      }).select("price _id createdAt")
    ]);

    const dailyMap = new Map<string, { count: number; revenue: number }>();
    const getDateKey = (date: Date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    for (const ord of recentOrders) {
      const dateKey = getDateKey(ord.createdAt);
      const amount = ord.totalPrice || 0;
      const existing = dailyMap.get(dateKey) || { count: 0, revenue: 0 };
      dailyMap.set(dateKey, {
        count: existing.count + 1,
        revenue: existing.revenue + amount,
      });
    }

    for (const rec of recentRecoveries) {
      if (!orderRecoveryIds.has(rec._id.toString())) {
        const dateKey = getDateKey(rec.createdAt);
        const price = rec.price || 0;
        const existing = dailyMap.get(dateKey) || { count: 0, revenue: 0 };
        dailyMap.set(dateKey, {
          count: existing.count + 1,
          revenue: existing.revenue + price,
        });
      }
    }

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

    // 3. Fetch list of most recent completed orders & recoveries (Limited to 200 to prevent OOM)
    const [orders, completedRecoveries] = await Promise.all([
      Order.find({ status: "COMPLETED" })
        .select("_id totalPrice orderType items userId status createdAt")
        .populate("userId", "username name email country")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      RecoveryRequest.find({ status: "COMPLETED" })
        .select("_id price accountLevel userId status createdAt")
        .populate("userId", "username name email country")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean()
    ]);

    const orderList: RevenueOrderDetails[] = [];

    // Format orders for table output
    for (const ord of orders) {
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
        customerCountry: userObj?.country || "",
        orderType: ord.orderType || "STOREFRONT",
        status: ord.status,
        totalPriceUSD: ord.totalPrice || 0,
        itemsCount: itemsList.length,
        items: itemsList,
        createdAt: new Date(ord.createdAt).toISOString(),
      });
    }

    // Format recovery requests for table output
    for (const rec of completedRecoveries) {
      const recIdStr = rec._id.toString();
      const price = rec.price || 0;
      if (price > 0 && !orderRecoveryIds.has(recIdStr)) {
        const userObj = rec.userId as any;
        const itemsList: RevenueOrderItem[] = [
          {
            name: `Account Recovery (Level ${rec.accountLevel || "N/A"})`,
            priceUSD: price,
            quantity: 1,
          },
        ];

        orderList.push({
          id: recIdStr,
          orderNumber: `#REC-${recIdStr.substring(18, 24).toUpperCase()}`,
          customerName: userObj?.username || userObj?.name || "Customer",
          customerEmail: userObj?.email || "No email",
          customerCountry: userObj?.country || "",
          orderType: "RECOVERY",
          status: "COMPLETED",
          totalPriceUSD: price,
          itemsCount: 1,
          items: itemsList,
          createdAt: new Date(rec.createdAt).toISOString(),
        });
      }
    }

    // Sort orderList chronologically for the table presentation
    orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

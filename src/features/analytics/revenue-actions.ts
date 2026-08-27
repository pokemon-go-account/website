"use server";

import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import RecoveryRequest from "@/models/RecoveryRequest";
import Registration from "@/models/Registration";
import Category from "@/models/Category";
import Product from "@/models/Product";
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
  categoryName?: string;
  categorySlug?: string;
}

export interface RevenueOrderDetails {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerCountry?: string;
  orderType: "STOREFRONT" | "BUY_NOW" | "AUCTION" | "RECOVERY" | "REGISTRATION";
  status: string;
  totalPriceUSD: number;
  investmentAmount?: number;
  investmentBy?: string;
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
        if (id && mongoose.Types.ObjectId.isValid(id.toString())) {
          orderRecoveryIds.add(id.toString());
        }
      }
    }

    const validRecoveryObjectIds = Array.from(orderRecoveryIds)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    // Calculate completed recoveries revenue that was paid through channels other than standard Storefront orders
    const independentRecoveries = await RecoveryRequest.find({
      status: "COMPLETED",
      price: { $gt: 0 },
      _id: { $nin: validRecoveryObjectIds }
    }).select("price");

    let independentRecoveryRevenue = 0;
    for (const rec of independentRecoveries) {
      independentRecoveryRevenue += rec.price || 0;
    }

    // Calculate total bidder registration deposit fees ($2.50 per registration explicitly added to revenue)
    const paidRegistrationsAll = await Registration.find({ addedToRevenue: true })
      .populate("userId", "username email name country")
      .lean();
    const registrationRevenueUSD = paidRegistrationsAll.length * 2.50;

    const totalOrdersCount = orderStatResult.count + independentRecoveries.length + paidRegistrationsAll.length;
    const storefrontRevenueUSD = orderStatResult.storefront;
    const buyNowRevenueUSD = orderStatResult.buyNow;
    const auctionRevenueUSD = orderStatResult.auction;
    const recoveryRevenueUSD = orderStatResult.recovery + independentRecoveryRevenue;
    const totalRevenueUSD = storefrontRevenueUSD + buyNowRevenueUSD + auctionRevenueUSD + recoveryRevenueUSD + registrationRevenueUSD;
    const averageOrderValueUSD = totalOrdersCount > 0 ? totalRevenueUSD / totalOrdersCount : 0;

    // 2. Fetch completed orders & recoveries for daily performance history (past 365 days)
    const maxDaysAgo = new Date();
    maxDaysAgo.setDate(maxDaysAgo.getDate() - 365);
    maxDaysAgo.setHours(0, 0, 0, 0);

    const [recentOrders, recentRecoveries] = await Promise.all([
      Order.find({
        status: "COMPLETED",
        createdAt: { $gte: maxDaysAgo }
      }).select("totalPrice createdAt"),
      RecoveryRequest.find({
        status: "COMPLETED",
        price: { $gt: 0 },
        createdAt: { $gte: maxDaysAgo }
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

    for (const reg of paidRegistrationsAll) {
      if (reg.createdAt) {
        const dateKey = getDateKey(new Date(reg.createdAt));
        const existing = dailyMap.get(dateKey) || { count: 0, revenue: 0 };
        dailyMap.set(dateKey, {
          count: existing.count + 1,
          revenue: existing.revenue + 2.50,
        });
      }
    }

    const dailyStats: DailyStat[] = [];
    const targetStart = new Date("2026-07-15T00:00:00Z");
    const today = new Date();
    const startDate = today < targetStart ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7) : targetStart;
    const curr = new Date(startDate);

    while (curr <= today) {
      const key = getDateKey(curr);
      const stat = dailyMap.get(key) || { count: 0, revenue: 0 };
      const formattedDate = curr.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyStats.push({
        date: key,
        formattedDate,
        ordersCount: stat.count,
        revenue: Math.round(stat.revenue * 100) / 100,
      });
      curr.setDate(curr.getDate() + 1);
    }

    // 3. Fetch list of most recent completed orders & recoveries (Limited to 200 to prevent OOM)
    const [orders, completedRecoveries, categories] = await Promise.all([
      Order.find({ status: "COMPLETED" })
        .select("_id totalPrice orderType items userId status createdAt investmentAmount investmentBy")
        .populate("userId", "username name email country")
        .populate("items.productId", "categoryId name")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      RecoveryRequest.find({ status: "COMPLETED" })
        .select("_id price accountLevel userId status createdAt")
        .populate("userId", "username name email country")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      Category.find({}).select("name slug").lean(),
    ]);

    const categoryMap = new Map<string, { name: string; slug: string }>();
    for (const cat of (categories || [])) {
      categoryMap.set(cat._id.toString(), { name: cat.name, slug: cat.slug });
    }

    const orderList: RevenueOrderDetails[] = [];

    // Format orders for table output
    for (const ord of orders) {
      const userObj = ord.userId as any;
      const itemsList: RevenueOrderItem[] = (ord.items || []).map((i: any) => {
        const prodObj = i.productId as any;
        const catIdStr = prodObj?.categoryId?.toString();
        const catObj = catIdStr ? categoryMap.get(catIdStr) : undefined;
        return {
          name: i.name || "Purchased Product",
          priceUSD: i.price || 0,
          quantity: i.quantity || 1,
          categoryName: catObj?.name || undefined,
          categorySlug: catObj?.slug || undefined,
        };
      });

      orderList.push({
        id: ord._id.toString(),
        orderNumber: `#ORD-${ord._id.toString().substring(18, 24).toUpperCase()}`,
        customerName: userObj?.username || userObj?.name || "Customer",
        customerEmail: userObj?.email || "No email",
        customerCountry: userObj?.country || "",
        orderType: ord.orderType || "STOREFRONT",
        status: ord.status,
        totalPriceUSD: ord.totalPrice || 0,
        investmentAmount: ord.investmentAmount || 0,
        investmentBy: ord.investmentBy || "",
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

    // Format paid bidder registrations for table output
    for (const reg of paidRegistrationsAll) {
      const regIdStr = (reg._id as any).toString();
      const userObj = reg.userId as any;
      orderList.push({
        id: regIdStr,
        orderNumber: `#REG-${regIdStr.substring(18, 24).toUpperCase()}`,
        customerName: userObj?.username || userObj?.name || "Bidder",
        customerEmail: userObj?.email || "No email",
        customerCountry: userObj?.country || "",
        orderType: "REGISTRATION",
        status: "COMPLETED",
        totalPriceUSD: 2.50,
        itemsCount: 1,
        items: [
          {
            name: "Bidder Registration Entry Deposit",
            priceUSD: 2.50,
            quantity: 1,
          },
        ],
        createdAt: reg.createdAt ? new Date(reg.createdAt).toISOString() : new Date().toISOString(),
      });
    }

    // Sort orderList chronologically for the table presentation
    orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalInvestmentUSD = orders.reduce((sum, ord) => sum + (ord.investmentAmount || 0), 0);
    const netProfitUSD = totalRevenueUSD - totalInvestmentUSD;

    return {
      success: true,
      data: {
        summary: {
          totalRevenueUSD: Math.round(totalRevenueUSD * 100) / 100,
          totalInvestmentUSD: Math.round(totalInvestmentUSD * 100) / 100,
          netProfitUSD: Math.round(netProfitUSD * 100) / 100,
          totalOrdersCount,
          averageOrderValueUSD: Math.round(averageOrderValueUSD * 100) / 100,
          storefrontRevenueUSD: Math.round(storefrontRevenueUSD * 100) / 100,
          buyNowRevenueUSD: Math.round(buyNowRevenueUSD * 100) / 100,
          auctionRevenueUSD: Math.round(auctionRevenueUSD * 100) / 100,
          recoveryRevenueUSD: Math.round(recoveryRevenueUSD * 100) / 100,
          registrationRevenueUSD: Math.round(registrationRevenueUSD * 100) / 100,
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

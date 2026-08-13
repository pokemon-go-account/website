"use server";

import connectDB from "@/lib/db";
import PageView from "@/models/PageView";
import { auth } from "@/auth";

export async function fetchAnalyticsData(range: string = "24h") {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role || "")) {
      return { 
        success: false, 
        error: "Unauthorized",
        data: {
          range: "24h",
          totalViews: 0,
          totalUniqueVisitors: 0,
          countryStats: [],
          pageStats: [],
          deviceStats: [],
          timeline: [],
        }
      };
    }

    let startDate = new Date();
    if (range === "24h") {
      startDate.setHours(startDate.getHours() - 24);
    } else if (range === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(startDate.getDate() - 30);
    }

    await connectDB();

    const totalViews = await PageView.countDocuments({ createdAt: { $gte: startDate } });
    const uniqueVisitorsResult = await PageView.distinct("visitorId", { createdAt: { $gte: startDate } });
    const totalUniqueVisitors = uniqueVisitorsResult.length;

    const countryStats = await PageView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { countryCode: "$countryCode", country: "$country" },
          views: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$visitorId" },
        },
      },
      {
        $project: {
          countryCode: "$_id.countryCode",
          country: "$_id.country",
          views: 1,
          uniqueVisitors: { $size: "$uniqueVisitors" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]);

    const pageStats = await PageView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$path",
          views: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$visitorId" },
        },
      },
      {
        $project: {
          path: "$_id",
          views: 1,
          uniqueVisitors: { $size: "$uniqueVisitors" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]);

    const deviceStats = await PageView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
    ]);

    return {
      success: true,
      data: {
        range,
        totalViews,
        totalUniqueVisitors,
        countryStats,
        pageStats,
        deviceStats,
        timeline: [],
      },
    };
  } catch (error: any) {
    console.error("fetchAnalyticsData error:", error);
    return {
      success: false,
      error: error.message,
      data: {
        range: "24h",
        totalViews: 0,
        totalUniqueVisitors: 0,
        countryStats: [],
        pageStats: [],
        deviceStats: [],
        timeline: [],
      },
    };
  }
}

export async function fetchActivePresence() {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role || "")) {
      return { success: false, error: "Unauthorized", activeSessions: [] };
    }

    await connectDB();
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeViews = await PageView.find({ createdAt: { $gte: tenMinsAgo } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return {
      success: true,
      activeSessions: JSON.parse(JSON.stringify(activeViews)),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      activeSessions: [],
    };
  }
}

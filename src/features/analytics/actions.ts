"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import PageView from "@/models/PageView";

export async function fetchAnalyticsData(range = "24h") {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role || "")) {
      return { success: false, error: "Unauthorized" };
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

    const groupFormat =
      range === "24h"
        ? { $hour: "$createdAt" }
        : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

    const timelineRaw = await PageView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: groupFormat,
          views: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      success: true,
      data: {
        range,
        totalViews,
        totalUniqueVisitors,
        countryStats: countryStats.map((c) => ({
          countryCode: c.countryCode || "UN",
          country: c.country || "Unknown",
          views: c.views,
          uniqueVisitors: c.uniqueVisitors,
        })),
        pageStats: pageStats.map((p) => ({
          path: p.path,
          views: p.views,
          uniqueVisitors: p.uniqueVisitors,
        })),
        deviceStats: deviceStats.map((d) => ({
          device: d._id || "desktop",
          count: d.count,
        })),
        timeline: timelineRaw.map((t) => ({
          label: String(t._id),
          views: t.views,
        })),
      },
    };
  } catch (error: any) {
    console.error("fetchAnalyticsData error:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchActivePresence() {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role || "")) {
      return { success: false, error: "Unauthorized" };
    }

    const now = Date.now();
    const activeSessions: any[] = [];

    // 1. Gather sessions from Node global in-memory store
    if (global.__ACTIVE_SESSIONS__) {
      for (const [, s] of global.__ACTIVE_SESSIONS__.entries()) {
        if (now - s.lastActive <= 35000) {
          activeSessions.push(s);
        }
      }
    }

    // 2. Try fetching from Firestore if available
    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      await import("@/lib/firebase-admin");
      const firestore = getFirestore();
      const snapshot = await firestore
        .collection("active_sessions")
        .where("lastActive", ">=", now - 35000)
        .get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!activeSessions.some((s) => s.visitorId === data.visitorId)) {
          activeSessions.push(data);
        }
      });
    } catch (err) {
      // Soft catch if Firebase Admin is uninitialized
    }

    return {
      success: true,
      activeSessions,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

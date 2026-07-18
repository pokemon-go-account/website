import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PageView from "@/models/PageView";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role || "")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "24h"; // 24h, 7d, 30d

    let startDate = new Date();
    if (range === "24h") {
      startDate.setHours(startDate.getHours() - 24);
    } else if (range === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(startDate.getDate() - 30);
    }

    await connectDB();

    // 1. Total Pageviews & Unique Visitors in period
    const totalViews = await PageView.countDocuments({ createdAt: { $gte: startDate } });
    const uniqueVisitorsResult = await PageView.distinct("visitorId", { createdAt: { $gte: startDate } });
    const totalUniqueVisitors = uniqueVisitorsResult.length;

    // 2. Top Countries
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

    // 3. Top Pages
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

    // 4. Device Breakdown
    const deviceStats = await PageView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
    ]);

    // 5. Views Timeline Chart
    const groupFormat = range === "24h" ? { $hour: "$createdAt" } : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

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

    return NextResponse.json({
      success: true,
      range,
      totalViews,
      totalUniqueVisitors,
      countryStats,
      pageStats,
      deviceStats,
      timeline: timelineRaw,
    });
  } catch (error: any) {
    console.error("Analytics stats error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

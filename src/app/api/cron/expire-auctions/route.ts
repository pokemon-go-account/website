import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Auction from "@/models/Auction";

export async function GET(request: Request) {
  try {
    // 1. Secure the endpoint using Vercel's CRON_SECRET (Automatically sent by Vercel)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (
      process.env.NODE_ENV === "production" &&
      cronSecret &&
      authHeader !== `Bearer ${cronSecret}`
    ) {
      console.warn("Unauthorized attempt to trigger cron job");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // 2. Find all LIVE or SCHEDULED auctions whose endTime has passed
    const now = new Date();
    
    // We update multiple documents at once for efficiency
    const result = await Auction.updateMany(
      {
        status: { $in: ["LIVE", "SCHEDULED"] },
        endTime: { $lt: now }
      },
      {
        $set: { status: "COMPLETED" }
      }
    );

    // 3. Clear cache for the auctions pages so changes reflect immediately
    if (result.modifiedCount > 0) {
      revalidatePath("/auctions");
      revalidatePath("/dashboard/admin");
      revalidatePath("/dashboard/seller");
    }

    return NextResponse.json({
      success: true,
      message: `Successfully expired ${result.modifiedCount} auctions.`,
      timestamp: now.toISOString()
    });
  } catch (error: any) {
    console.error("Cron Job Error (expire-auctions):", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

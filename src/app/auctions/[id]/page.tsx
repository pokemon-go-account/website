import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Auction from "@/models/Auction";
import Bid from "@/models/Bid";
import User from "@/models/User"; // Registers model for populate
import { LiveRoom } from "@/features/auctions/components/live-room";

interface AuctionPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Dynamic rendering

export default async function AuctionPage({ params }: AuctionPageProps) {
  const { id } = await params;

  await connectDB();

  // Fetch the auction and populate the listing details
  const auctionDoc = await Auction.findById(id)
    .populate("listingId")
    .lean();

  if (!auctionDoc) {
    notFound();
  }

  // Fetch top 20 recent bids
  const bidDocs = await Bid.find({ auctionId: id })
    .populate("bidderId", "name")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Format database objects into clean props
  const formattedAuction = {
    _id: auctionDoc._id.toString(),
    listingId: {
      title: (auctionDoc.listingId as any).title,
      description: (auctionDoc.listingId as any).description,
      level: (auctionDoc.listingId as any).level,
      shinyCount: (auctionDoc.listingId as any).shinyCount,
      legendaryCount: (auctionDoc.listingId as any).legendaryCount,
      mythicalCount: (auctionDoc.listingId as any).mythicalCount,
      team: (auctionDoc.listingId as any).team,
      minIncrement: (auctionDoc.listingId as any).minIncrement,
      startingBid: (auctionDoc.listingId as any).startingBid,
      region: (auctionDoc.listingId as any).region,
    },
    currentHighestBid: auctionDoc.currentHighestBid,
    highestBidderId: auctionDoc.highestBidderId?.toString() || null,
    endTime: (auctionDoc.endTime as Date).toISOString(),
    status: auctionDoc.status,
  };

  const formattedBids = bidDocs.map((b: any) => ({
    _id: b._id.toString(),
    bidderName: b.bidderId?.name || "Anonymous",
    amount: b.amount,
    createdAt: b.createdAt.toISOString(),
  }));

  return <LiveRoom auction={formattedAuction} initialBids={formattedBids} />;
}

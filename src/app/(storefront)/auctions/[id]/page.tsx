import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Auction from "@/models/Auction";
import { expireStaleAuctions } from "@/features/auctions/actions";
import Bid from "@/models/Bid";
import User from "@/models/User"; // Registers model for populate
import Listing from "@/models/Listing"; // Registers model for populate
import Registration from "@/models/Registration"; // Registers model for registration check
import { auth } from "@/auth";
import { LiveRoom } from "@/features/auctions/components/live-room";

interface AuctionPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Dynamic rendering

export default async function AuctionPage({ params }: AuctionPageProps) {
  const { id } = await params;

  await connectDB();
  await expireStaleAuctions();

  // Explicitly reference models to prevent Turbopack tree-shaking
  const _userCheck = User;
  const _listingCheck = Listing;
  const _registrationCheck = Registration;

  const session = await auth();

  // Increment viewers count and initiate database queries in parallel
  const auctionPromise = Auction.findByIdAndUpdate(
    id,
    { $inc: { viewers: 1 } },
    { returnDocument: "after" }
  )
    .populate("listingId")
    .populate("highestBidderId", "name username")
    .lean();

  const bidsPromise = Bid.find({ auctionId: id })
    .populate("bidderId", "username")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const registrationPromise = session?.user?.id
    ? User.findById(session.user.id).lean()
    : Promise.resolve(null);

  // Await queries concurrently
  const [auctionDoc, bidDocs, registrationDoc] = await Promise.all([
    auctionPromise,
    bidsPromise,
    registrationPromise
  ]);

  if (!auctionDoc || !auctionDoc.listingId) {
    notFound();
  }

  const initialIsRegistered = !!(registrationDoc && (registrationDoc as any).hasPaidVerificationDeposit);

  // Format database objects into clean props and serialize BSON types
  const serializedAuctionDoc = JSON.parse(JSON.stringify(auctionDoc));
  const listingDoc = serializedAuctionDoc.listingId as any;
  const formattedAuction = {
    ...serializedAuctionDoc,
    _id: serializedAuctionDoc._id,
    listingId: {
      ...listingDoc,
      _id: listingDoc._id,
      sellerId: listingDoc.sellerId || "",
    },
    currentHighestBid: serializedAuctionDoc.currentHighestBid,
    highestBidderId: serializedAuctionDoc.highestBidderId ? (serializedAuctionDoc.highestBidderId as any)._id || (serializedAuctionDoc.highestBidderId as any) : null,
    highestBidderName: (serializedAuctionDoc.highestBidderId as any)?.username || (serializedAuctionDoc.highestBidderId as any)?.name || null,
    endTime: serializedAuctionDoc.endTime,
    status: serializedAuctionDoc.status,
    registrationFee: serializedAuctionDoc.registrationFee || 199,
    viewers: serializedAuctionDoc.viewers || 0,
  };

  const formattedBids = bidDocs.map((b: any) => ({
    _id: b._id.toString(),
    bidderName: b.bidderId?.username || "Anonymous",
    amount: b.amount,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <LiveRoom 
      auction={formattedAuction} 
      initialBids={formattedBids} 
      initialIsRegistered={initialIsRegistered} 
      session={session}
    />
  );
}

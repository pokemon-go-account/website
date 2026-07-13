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

  // Format database objects into clean props
  const listingDoc = auctionDoc.listingId as any;
  const formattedAuction = {
    ...auctionDoc,
    _id: auctionDoc._id.toString(),
    listingId: {
      ...listingDoc,
      _id: listingDoc._id?.toString(),
      sellerId: listingDoc.sellerId?.toString() || "",
    },
    currentHighestBid: auctionDoc.currentHighestBid,
    highestBidderId: auctionDoc.highestBidderId ? (auctionDoc.highestBidderId as any)._id?.toString() || (auctionDoc.highestBidderId as any).toString() : null,
    highestBidderName: (auctionDoc.highestBidderId as any)?.username || (auctionDoc.highestBidderId as any)?.name || null,
    endTime: (auctionDoc.endTime as Date).toISOString(),
    status: auctionDoc.status,
    registrationFee: auctionDoc.registrationFee || 199,
    viewers: auctionDoc.viewers || 0,
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

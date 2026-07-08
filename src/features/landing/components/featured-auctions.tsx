import Link from "next/link";
import connectDB from "@/lib/db";
import Auction from "@/models/Auction";
import Listing from "@/models/Listing"; // Registers model to prevent Turbopack tree-shaking
import { Clock, CheckCircle2 } from "lucide-react";

const teamColors: Record<string, string> = {
  MYSTIC: "text-blue-500",
  VALOR: "text-red-500",
  INSTINCT: "text-yellow-500",
  NONE: "text-gray-400",
};

const whyChooseUs = [
  "Largest Pokémon GO Auction Community",
  "Verified Assets",
  "Fair Auctions",
  "Instant Delivery (Items)",
  "Dedicated Support",
];

function formatTimeLeft(endTime: Date): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

import { FeaturedAuctionsClient } from "./featured-auctions-client";

interface LiveAuction {
  _id: string;
  currentHighestBid: number;
  endTime?: Date;
  listing: {
    title: string;
    level: number;
    shinyCount: number;
    legendaryCount: number;
    team: string;
    startingBid: number;
  };
}

async function getLiveAuctions(): Promise<LiveAuction[]> {
  try {
    await connectDB();
    // Explicitly reference Listing model to prevent tree-shaking
    const _modelCheck = Listing;
    const now = new Date();
    const auctions = await Auction.find({
      status: "LIVE",
      endTime: { $gt: now },
    })
      .sort({ endTime: 1 })
      .limit(4)
      .populate("listingId", "title level shinyCount legendaryCount team startingBid")
      .lean();
    return auctions
      .filter((a: any) => a.listingId)
      .map((a: any) => ({
        _id: a._id.toString(),
        currentHighestBid: a.currentHighestBid,
        endTime: a.endTime,
        listing: {
          title: a.listingId.title,
          level: a.listingId.level,
          shinyCount: a.listingId.shinyCount,
          legendaryCount: a.listingId.legendaryCount,
          team: a.listingId.team,
          startingBid: a.listingId.startingBid,
        },
      }));
  } catch {
    return [];
  }
}

export async function FeaturedAuctions() {
  const auctions = await getLiveAuctions();

  return (
    <section className="bg-white dark:bg-[#080809] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FeaturedAuctionsClient auctions={auctions} />
      </div>
    </section>
  );
}

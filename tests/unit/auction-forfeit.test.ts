import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { triggerForfeitCascade } from "@/features/admin/actions";
import Auction from "@/models/Auction";
import Listing from "@/models/Listing";
import User from "@/models/User";
import Bid from "@/models/Bid";
import { auth } from "@/auth";

const LISTING_FIXTURE = {
  title: "Forfeit Test Account",
  description: "Detailed description",
  telegramUsername: "forfeit_tester",
  level: 40,
  xp: 12000000,
  stardust: 500000,
  team: "VALOR" as const,
  shinyCount: 5,
  legendaryCount: 5,
  mythicalCount: 5,
  region: "Global",
  screenshots: ["https://example.com/ss.jpg"],
  startingBid: 10,
  reservePrice: 30,
  minIncrement: 5,
  durationHours: 24,
  startDate: "2016-07-05",
  accountType: "Regular",
  accountStatus: "Good Standing",
};

describe("Time-Sensitive Auction Forfeit Cascades", () => {
  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Auction.deleteMany({});
    await Listing.deleteMany({});
    await User.deleteMany({});
    await Bid.deleteMany({});
    vi.clearAllMocks();
  });

  it("should increment winner forfeitCount and reset auction status to COMPLETED if no runner-up bids exist", async () => {
    // Auth as Admin
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin1", role: "ADMIN", adminRentPaidUntil: new Date(Date.now() + 3600000).toISOString() },
      expires: "9999",
    } as any);

    const winner = (await User.create({
      name: "Winner User",
      email: "winner@example.com",
      username: "winner1",
      forfeitCount: 1,
    })) as any;

    const listing = (await Listing.create({
      ...LISTING_FIXTURE,
      sellerId: new mongoose.Types.ObjectId(),
    })) as any;

    const auction = (await Auction.create({
      listingId: listing._id,
      status: "COMPLETED",
      highestBidderId: winner._id,
      currentHighestBid: 50,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 1000),
    })) as any;

    // Trigger cascade (no bids in database, so no runner-up)
    const res = await triggerForfeitCascade(auction._id.toString());
    expect(res.success).toBe(true);

    // Verify winner forfeit count incremented
    const updatedWinner = await User.findById(winner._id);
    expect(updatedWinner?.forfeitCount).toBe(2);
    expect(updatedWinner?.isSuspended).toBe(false);

    // Verify auction was reset to starting bid and completed
    const updatedAuction = await Auction.findById(auction._id);
    expect(updatedAuction?.highestBidderId).toBeUndefined();
    expect(updatedAuction?.currentHighestBid).toBe(10);
    expect(updatedAuction?.status).toBe("COMPLETED");
  });

  it("should suspend the winning user if their forfeitCount reaches 3", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin1", role: "ADMIN", adminRentPaidUntil: new Date(Date.now() + 3600000).toISOString() },
      expires: "9999",
    } as any);

    const winner = (await User.create({
      name: "Flaky Winner",
      email: "flaky@example.com",
      username: "flaky1",
      forfeitCount: 2, // 2 previous forfeits
    })) as any;

    const listing = (await Listing.create({
      ...LISTING_FIXTURE,
      sellerId: new mongoose.Types.ObjectId(),
    })) as any;

    const auction = (await Auction.create({
      listingId: listing._id,
      status: "COMPLETED",
      highestBidderId: winner._id,
      currentHighestBid: 50,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 1000),
    })) as any;

    const res = await triggerForfeitCascade(auction._id.toString());
    expect(res.success).toBe(true);

    const updatedWinner = await User.findById(winner._id);
    expect(updatedWinner?.forfeitCount).toBe(3);
    expect(updatedWinner?.isSuspended).toBe(true); // Account blocked automatically!
  });

  it("should cascade to runner-up bid if one exists, extending the clock by 24h and setting status to LIVE", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin1", role: "ADMIN", adminRentPaidUntil: new Date(Date.now() + 3600000).toISOString() },
      expires: "9999",
    } as any);

    const winner = (await User.create({
      name: "Winner User",
      email: "winner@example.com",
      username: "winner1",
      forfeitCount: 0,
    })) as any;

    const runnerUp = (await User.create({
      name: "Runner Up User",
      email: "runner@example.com",
      username: "runner1",
      forfeitCount: 0,
    })) as any;

    const listing = (await Listing.create({
      ...LISTING_FIXTURE,
      sellerId: new mongoose.Types.ObjectId(),
    })) as any;

    const auction = (await Auction.create({
      listingId: listing._id,
      status: "COMPLETED",
      highestBidderId: winner._id,
      currentHighestBid: 50,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 1000),
    })) as any;

    // Create bids
    await Bid.create({
      auctionId: auction._id,
      bidderId: winner._id,
      amount: 50,
    });

    await Bid.create({
      auctionId: auction._id,
      bidderId: runnerUp._id,
      amount: 45,
    });

    const res = await triggerForfeitCascade(auction._id.toString());
    expect(res.success).toBe(true);

    const updatedAuction = await Auction.findById(auction._id);
    // Verifies highest bidder is now the runner-up and current price is updated
    expect(updatedAuction?.highestBidderId?.toString()).toBe(runnerUp._id.toString());
    expect(updatedAuction?.currentHighestBid).toBe(45);
    expect(updatedAuction?.status).toBe("LIVE");
    // Clock extended by 24 hours (tolerance of 5 seconds)
    const timeDiff = (updatedAuction as any).endTime.getTime() - (Date.now() + 24 * 60 * 60 * 1000);
    expect(Math.abs(timeDiff)).toBeLessThan(5000);
  });
});

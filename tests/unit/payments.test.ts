import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import {
  createRegistrationOrder,
  checkUserRegistrationStatus,
  simulateMockPayment,
} from "@/features/payments/actions";
import User from "@/models/User";
import Auction from "@/models/Auction";
import Registration from "@/models/Registration";
import Listing from "@/models/Listing";
import { auth } from "@/auth";

// Mock Razorpay SDK
vi.mock("razorpay", () => {
  return {
    default: class {
      orders = {
        create: vi.fn().mockResolvedValue({ id: "order_real_12345" }),
      };
    },
  };
});

const LISTING_FIXTURE = {
  title: "Payment Test Account",
  description: "Detailed description",
  telegramUsername: "pay_tester",
  level: 40,
  xp: 12000000,
  stardust: 500000,
  team: "MYSTIC" as const,
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

describe("Payments Actions", () => {
  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Auction.deleteMany({});
    await Registration.deleteMany({});
    await Listing.deleteMany({});
    vi.clearAllMocks();
  });

  describe("createRegistrationOrder", () => {
    it("should fail if user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await createRegistrationOrder("507f1f77bcf86cd799439011");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("should succeed in placeholder sandbox mode", async () => {
      const user = (await User.create({
        name: "Bidder 1",
        username: "bidder1",
        email: "bidder1@example.com",
        hasPaidVerificationDeposit: false,
      })) as any;

      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: "9999" } as any);

      const listing = (await Listing.create({
        ...LISTING_FIXTURE,
        sellerId: new mongoose.Types.ObjectId(),
        status: "APPROVED",
      })) as any;

      const auction = (await Auction.create({
        listingId: listing._id,
        status: "LIVE",
        currentHighestBid: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
      })) as any;

      // Force placeholder credentials in environment
      process.env.RAZORPAY_KEY_ID = "rzp_test_placeholder";
      process.env.RAZORPAY_KEY_SECRET = "secret_placeholder";

      const res = await createRegistrationOrder(auction._id.toString());
      expect(res.success).toBe(true);
      expect((res as any).orderContext?.id).toContain("order_mock_");

      const reg = await Registration.findOne({ userId: user._id, auctionId: auction._id });
      expect(reg).not.toBeNull();
      expect(reg?.status).toBe("PENDING");
    });

    it("should succeed using mocked Razorpay SDK in live credentials mode", async () => {
      const user = (await User.create({
        name: "Bidder 2",
        username: "bidder2",
        email: "bidder2@example.com",
        hasPaidVerificationDeposit: false,
      })) as any;

      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: "9999" } as any);

      const listing = (await Listing.create({
        ...LISTING_FIXTURE,
        sellerId: new mongoose.Types.ObjectId(),
        status: "APPROVED",
      })) as any;

      const auction = (await Auction.create({
        listingId: listing._id,
        status: "LIVE",
        currentHighestBid: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
      })) as any;

      // Force real-looking credentials
      process.env.RAZORPAY_KEY_ID = "rzp_test_real123";
      process.env.RAZORPAY_KEY_SECRET = "real_secret_key456";

      const res = await createRegistrationOrder(auction._id.toString());
      expect(res.success).toBe(true);
      expect((res as any).orderContext?.id).toBe("order_real_12345");

      const reg = await Registration.findOne({ userId: user._id, auctionId: auction._id });
      expect(reg).not.toBeNull();
      expect(reg?.razorpayOrderId).toBe("order_real_12345");
    });
  });

  describe("checkUserRegistrationStatus", () => {
    it("should return correct status when user is registered and paid", async () => {
      const user = (await User.create({
        name: "Registered User",
        username: "reguser",
        email: "reguser@example.com",
        hasPaidVerificationDeposit: true,
      })) as any;

      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: "9999" } as any);

      const auctionId = new mongoose.Types.ObjectId().toString();

      await Registration.create({
        userId: user._id,
        auctionId,
        status: "PAID",
        razorpayOrderId: "order_mock_status_check",
      });

      const res = await checkUserRegistrationStatus(auctionId);
      expect(res.isRegistered).toBe(true);
    });
  });

  describe("simulateMockPayment", () => {
    it("should successfully verify mock registration order", async () => {
      const user = (await User.create({
        name: "Mock Buyer",
        username: "mockbuyer",
        email: "mockbuyer@example.com",
        hasPaidVerificationDeposit: false,
      })) as any;

      const reg = (await Registration.create({
        userId: user._id,
        auctionId: new mongoose.Types.ObjectId(),
        status: "PENDING",
        razorpayOrderId: "order_mock_test123",
      })) as any;

      process.env.RAZORPAY_KEY_ID = "rzp_test_placeholder";
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: "9999" } as any);

      const res = await simulateMockPayment("order_mock_test123");
      expect(res.success).toBe(true);

      const updatedReg = await Registration.findById(reg._id);
      expect(updatedReg?.status).toBe("PAID");

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.hasPaidVerificationDeposit).toBe(true);
      expect(updatedUser?.walletBalance).toBe(2.5);
    });
  });
});

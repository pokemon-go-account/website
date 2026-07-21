import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { GET as expireAuctionsGET } from "@/app/api/cron/expire-auctions/route";
import { POST as pingPOST } from "@/app/api/analytics/ping/route";
import { GET as statsGET } from "@/app/api/analytics/stats/route";
import { POST as submitPaymentPOST } from "@/app/api/payments/submit/route";
import Auction from "@/models/Auction";
import Listing from "@/models/Listing";
import Payment from "@/models/Payment";
import PageView from "@/models/PageView";
import { auth } from "@/auth";

// Mock Cloudinary
vi.mock("@/lib/cloudinary", () => ({
  uploadToCloudinary: vi.fn().mockResolvedValue("https://cloudinary.com/payment_screenshot.jpg"),
}));

const LISTING_FIXTURE = {
  title: "API Listing Account",
  description: "Detailed description",
  telegramUsername: "api_tester",
  level: 30,
  xp: 5000000,
  stardust: 100000,
  team: "VALOR" as const,
  shinyCount: 2,
  legendaryCount: 3,
  mythicalCount: 1,
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

describe("API Route Handlers", () => {
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
    await Payment.deleteMany({});
    await PageView.deleteMany({});
    vi.clearAllMocks();
  });

  describe("GET /api/cron/expire-auctions", () => {
    it("should expire stale auctions whose end time has passed", async () => {
      const listing = await Listing.create({
        ...LISTING_FIXTURE,
        sellerId: new mongoose.Types.ObjectId(),
        status: "APPROVED",
      });

      const expiredAuction = await Auction.create({
        listingId: listing._id,
        status: "LIVE",
        currentHighestBid: 10,
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() - 1800000), // ended 30m ago
      });

      const request = new Request("http://localhost/api/cron/expire-auctions");
      const response = await expireAuctionsGET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);

      const updated = await Auction.findById(expiredAuction._id);
      expect(updated?.status).toBe("COMPLETED");
    });
  });

  describe("POST /api/analytics/ping", () => {
    it("should respond with success: true", async () => {
      const response = await pingPOST();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });
  });

  describe("GET /api/analytics/stats", () => {
    it("should fail if user is not authorized", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const request = new NextRequest("http://localhost/api/analytics/stats");
      const response = await statsGET(request);
      expect(response.status).toBe(401);
    });

    it("should return page view statistics for authorized admins", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin1", role: "ADMIN" },
        expires: "9999",
      } as any);

      await PageView.create({
        visitorId: "v_12345",
        path: "/auctions",
        referrer: "",
        device: "Desktop",
        countryCode: "US",
        country: "United States",
      });

      const request = new NextRequest("http://localhost/api/analytics/stats?range=24h");
      const response = await statsGET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.totalViews).toBe(1);
      expect(json.totalUniqueVisitors).toBe(1);
    });
  });

  describe("POST /api/payments/submit", () => {
    it("should create payment successfully with valid inputs", async () => {
      const body = {
        orderId: "ord_123",
        amount: 250,
        customerEmail: "pay@example.com",
        utrNumber: "123456789012",
        screenshotBase64: "data:image/jpeg;base64,mockdata",
      };

      const request = new NextRequest("http://localhost/api/payments/submit", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const response = await submitPaymentPOST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.paymentId).toBeDefined();

      const payment = await Payment.findById(json.paymentId);
      expect(payment).not.toBeNull();
      expect(payment?.status).toBe("Pending");
      expect(payment?.utrNumber).toBe("123456789012");
    });

    it("should fail validation if inputs are invalid", async () => {
      const body = {
        orderId: "ord_123",
        amount: 250,
        customerEmail: "pay@example.com",
        utrNumber: "invalid-utr-string",
        screenshotBase64: "data:image/jpeg;base64,mockdata",
      };

      const request = new NextRequest("http://localhost/api/payments/submit", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const response = await submitPaymentPOST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toContain("UTR number must be up to 12 digits");
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { getRevenueAnalyticsAction } from "@/features/analytics/revenue-actions";
import Order from "@/models/Order";
import RecoveryRequest from "@/models/RecoveryRequest";
import User from "@/models/User";
import { auth } from "@/auth";

describe("Revenue Analytics Action", () => {
  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Order.deleteMany({});
    await RecoveryRequest.deleteMany({});
    await User.deleteMany({});
    vi.clearAllMocks();
  });

  it("should fail if user is not SUPER_ADMIN", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user1", role: "USER" }, expires: "9999" } as any);
    const res = await getRevenueAnalyticsAction();
    expect(res.success).toBe(false);
    expect(res.error).toContain("Unauthorized");
  });

  it("should correctly compute revenue aggregates and avoid double-counting recovery requests", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "super1", role: "SUPER_ADMIN" }, expires: "9999" } as any);

    const client = await User.create({
      name: "Client 1",
      username: "client1",
      email: "client1@example.com",
    });

    // 1. Create a completed storefront order ($95)
    await Order.create({
      userId: client._id,
      orderType: "STOREFRONT",
      totalPrice: 95,
      status: "COMPLETED",
      items: [{ name: "PokeCoins Package", price: 95, quantity: 1 }],
      createdAt: new Date(),
    });

    // 2. Create a completed recovery request ($50)
    const recoveryReq = await RecoveryRequest.create({
      userId: client._id,
      accountLevel: 30,
      startDate: new Date(),
      creationMethod: "Google",
      contactMethod: "Discord",
      contactId: "test#123",
      hasEmailAccess: true,
      price: 50,
      status: "COMPLETED",
      createdAt: new Date(),
    });

    // 3. Create a completed RECOVERY type order paying for that recovery request ($50)
    await Order.create({
      userId: client._id,
      orderType: "RECOVERY",
      totalPrice: 50,
      status: "COMPLETED",
      items: [{ name: "Account Recovery", price: 50, quantity: 1, productId: recoveryReq._id }],
      createdAt: new Date(),
    });

    // Run the action
    const res = await getRevenueAnalyticsAction();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();

    const summary = res.data!.summary;
    // Total revenue should be Storefront ($95) + Recovery ($50) = $145
    // (If double counted, it would be $195 because of the recoveryReq being added independently)
    expect(summary.totalRevenueUSD).toBe(145);
    expect(summary.storefrontRevenueUSD).toBe(95);
    expect(summary.recoveryRevenueUSD).toBe(50);
    expect(summary.totalOrdersCount).toBe(2);
  });
});

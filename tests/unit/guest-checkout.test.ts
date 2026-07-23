import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { createGuestSessionAction, getGuestSessionAction } from "@/features/auth/guest-actions";
import { createStorefrontOrderAction } from "@/features/store/actions";
import User from "@/models/User";
import Order from "@/models/Order";

describe("Guest Anonymous Checkout Unit Tests", () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pokemon_auction_test";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({ isGuest: true });
    await Order.deleteMany({ isGuest: true });
  });

  it("should create a new guest session user in database", async () => {
    const res = await createGuestSessionAction({
      socialPlatform: "Discord",
      socialId: "guest_tester#1234",
    });

    expect(res.success).toBe(true);
    expect(res.guestSession).toBeDefined();
    expect(res.guestSession?.socialPlatform).toBe("Discord");
    expect(res.guestSession?.socialId).toBe("guest_tester#1234");

    const createdUser = await User.findById(res.guestSession?.userId);
    expect(createdUser).not.toBeNull();
    expect(createdUser?.isGuest).toBe(true);
    expect(createdUser?.guestSocialPlatform).toBe("Discord");
    expect(createdUser?.guestSocialId).toBe("guest_tester#1234");
  });

  it("should reject guest session creation if fields are missing", async () => {
    const res = await createGuestSessionAction({
      socialPlatform: "",
      socialId: "",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});

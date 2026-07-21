import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { verifyPayment, rejectPayment } from "@/features/console/payment-actions";
import Payment from "@/models/Payment";
import { auth } from "@/auth";

describe("Console Payment Actions", () => {
  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Payment.deleteMany({});
    vi.clearAllMocks();
  });

  describe("Authorization Gates", () => {
    it("should fail verifyPayment if session is null", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      await expect(verifyPayment("507f1f77bcf86cd799439011")).rejects.toThrow("Unauthorized");
    });

    it("should fail verifyPayment if user is not SUPER_ADMIN", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user1", role: "USER" },
        expires: "9999",
      } as any);
      await expect(verifyPayment("507f1f77bcf86cd799439011")).rejects.toThrow("Unauthorized");
    });

    it("should fail rejectPayment if user is not SUPER_ADMIN", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user1", role: "USER" },
        expires: "9999",
      } as any);
      await expect(rejectPayment("507f1f77bcf86cd799439011")).rejects.toThrow("Unauthorized");
    });
  });

  describe("Functional Operations", () => {
    it("should verify payment status successfully", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "super1", role: "SUPER_ADMIN" },
        expires: "9999",
      } as any);

      const payment = await Payment.create({
        orderId: "ord_12345",
        amount: 150,
        customerEmail: "cust@example.com",
        utrNumber: "123456789012",
        screenshotUrl: "https://example.com/ss.jpg",
        status: "Pending",
      });

      await verifyPayment(payment._id.toString());

      const updated = await Payment.findById(payment._id);
      expect(updated?.status).toBe("Verified");
    });

    it("should reject payment status successfully", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "super1", role: "SUPER_ADMIN" },
        expires: "9999",
      } as any);

      const payment = await Payment.create({
        orderId: "ord_12345",
        amount: 150,
        customerEmail: "cust@example.com",
        utrNumber: "123456789012",
        screenshotUrl: "https://example.com/ss.jpg",
        status: "Pending",
      });

      await rejectPayment(payment._id.toString());

      const updated = await Payment.findById(payment._id);
      expect(updated?.status).toBe("Rejected");
    });
  });
});

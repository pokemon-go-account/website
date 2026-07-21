import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import {
  submitFeedback,
  submitOrderFeedback,
  editOrderFeedback,
  deleteOrderFeedback,
} from "@/features/feedback/actions";
import Feedback from "@/models/Feedback";
import Order from "@/models/Order";
import User from "@/models/User";
import { auth } from "@/auth";

describe("Feedback Actions", () => {
  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Feedback.deleteMany({});
    await Order.deleteMany({});
    await User.deleteMany({});
    vi.clearAllMocks();
  });

  describe("submitFeedback (General)", () => {
    it("should fail validation if form input is invalid", async () => {
      const formData = new FormData();
      formData.append("rating", "6"); // invalid rating
      formData.append("comment", "Short");

      const res = await submitFeedback(null, formData);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it("should successfully submit general feedback with an authenticated user", async () => {
      const user = (await User.create({
        name: "Feedback User",
        username: "feeduser",
        email: "feeduser@example.com",
        isOnboarded: true,
      })) as any;

      // Create a completed order to make user eligible to leave feedback
      await Order.create({
        userId: user._id,
        items: [{ name: "PokeCoins Package", price: 10, quantity: 1 }],
        totalPrice: 10,
        status: "COMPLETED",
        orderType: "STOREFRONT",
      });

      vi.mocked(auth).mockResolvedValue({
        user: { id: user._id.toString(), name: "Feedback User" },
        expires: "9999",
      } as any);

      const formData = new FormData();
      formData.append("rating", "5");
      formData.append("comment", "This services platform is amazing!");

      const res = await submitFeedback(null, formData);
      expect(res.success).toBe(true);

      const saved = await Feedback.findOne({ username: "feeduser" });
      expect(saved).not.toBeNull();
      expect(saved?.rating).toBe(5);
      expect(saved?.userId?.toString()).toBe(user._id.toString());
    });
  });

  describe("Order Feedback Operations", () => {
    it("should submit, edit, and delete order feedback successfully", async () => {
      const user = (await User.create({
        name: "Order Buyer",
        username: "orderbuyer",
        email: "orderbuyer@example.com",
      })) as any;

      vi.mocked(auth).mockResolvedValue({
        user: { id: user._id.toString(), name: "Order Buyer" },
        expires: "9999",
      } as any);

      const order = (await Order.create({
        userId: user._id,
        items: [{ name: "Shiny Mewtwo", price: 50, quantity: 1 }],
        totalPrice: 50,
        status: "COMPLETED",
        orderType: "STOREFRONT",
      })) as any;

      // Submit Order Feedback
      let res = await submitOrderFeedback(order._id.toString(), 5, "Awesome seller!");
      expect(res.success).toBe(true);

      let saved = await Feedback.findOne({ orderId: order._id });
      expect(saved).not.toBeNull();
      expect(saved?.rating).toBe(5);
      expect(saved?.comment).toBe("Awesome seller!");

      // Edit Order Feedback
      res = await editOrderFeedback(saved!._id.toString(), 4, "Slightly slow delivery but awesome!");
      expect(res.success).toBe(true);

      let updated = await Feedback.findById(saved!._id);
      expect(updated?.rating).toBe(4);
      expect(updated?.comment).toBe("Slightly slow delivery but awesome!");

      // Delete Order Feedback
      res = await deleteOrderFeedback(updated!._id.toString());
      expect(res.success).toBe(true);

      const deleted = await Feedback.findById(updated!._id);
      expect(deleted).toBeNull();
    });
  });
});

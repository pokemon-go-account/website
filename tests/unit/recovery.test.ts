import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import {
  submitRecoveryRequest,
  getRecoveryRequests,
  getUserRecoveryRequests,
  updateRecoveryRequestPrice,
  updateRecoveryRequestStatus,
  markRecoveryAsPaid,
  deleteRecoveryRequest,
  getCloudinaryUploadSignature,
} from "@/features/recovery/actions";
import RecoveryRequest from "@/models/RecoveryRequest";
import User from "@/models/User";
import { auth } from "@/auth";

describe("Recovery Actions", () => {
  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await RecoveryRequest.deleteMany({});
    await User.deleteMany({});
    vi.clearAllMocks();
  });

  describe("submitRecoveryRequest", () => {
    it("should fail if user is not signed in", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const formData = new FormData();
      const res = await submitRecoveryRequest(null, formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("should succeed with valid inputs", async () => {
      const user = (await User.create({
        name: "Recovery User",
        username: "recuser",
        email: "recuser@example.com",
      })) as any;

      vi.mocked(auth).mockResolvedValue({
        user: { id: user._id.toString() },
        expires: "9999",
      } as any);

      const formData = new FormData();
      formData.append("trainerName", "AshKetchum");
      formData.append("accountLevel", "40");
      formData.append("startDate", "2026-07-21");
      formData.append("creationMethod", "Google");
      formData.append("contactMethod", "Discord");
      formData.append("contactId", "ash#1234");
      formData.append("hasEmailAccess", "true");
      formData.append("screenshotUrlsJson", JSON.stringify(["https://example.com/ss1.jpg"]));

      const res = await submitRecoveryRequest(null, formData);
      expect(res.success).toBe(true);

      const saved = await RecoveryRequest.findOne({ userId: user._id });
      expect(saved).not.toBeNull();
      expect(saved?.trainerName).toBe("AshKetchum");
      expect(saved?.accountLevel).toBe(40);
      expect(saved?.screenshotUrls?.[0]).toBe("https://example.com/ss1.jpg");
    });
  });

  describe("Admin & User Recovery Queries and Mutations", () => {
    it("should perform recovery requests workflows successfully", async () => {
      const user = (await User.create({
        name: "Recovery Client",
        username: "recclient",
        email: "recclient@example.com",
      })) as any;

      const request = (await RecoveryRequest.create({
        userId: user._id,
        accountLevel: 45,
        startDate: new Date(),
        creationMethod: "PTC",
        contactMethod: "Telegram",
        contactId: "recclient_tg",
        hasEmailAccess: true,
        status: "PENDING",
      })) as any;

      // Admin update price (requires SUPER_ADMIN)
      vi.mocked(auth).mockResolvedValue({ user: { id: "super1", role: "SUPER_ADMIN" }, expires: "9999" } as any);
      let res = await updateRecoveryRequestPrice(request._id.toString(), 150);
      expect(res.success).toBe(true);
      let updated = await RecoveryRequest.findById(request._id);
      expect(updated?.price).toBe(150);
      expect(updated?.priceStatus).toBe("QUOTED");

      // Admin update status (requires SUPER_ADMIN)
      res = await updateRecoveryRequestStatus(request._id.toString(), "IN_PROGRESS");
      expect(res.success).toBe(true);
      updated = await RecoveryRequest.findById(request._id);
      expect(updated?.status).toBe("IN_PROGRESS");

      // Mark recovery as paid (called by client who owns the request)
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: "9999" } as any);
      res = await markRecoveryAsPaid(request._id.toString());
      expect(res.success).toBe(true);

      // User retrieve their requests
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: "9999" } as any);
      const userRequests = await getUserRecoveryRequests();
      expect(userRequests.success).toBe(true);
      expect(userRequests.requests?.length).toBe(1);

      // Admin delete request (requires SUPER_ADMIN)
      vi.mocked(auth).mockResolvedValue({ user: { id: "super1", role: "SUPER_ADMIN" }, expires: "9999" } as any);
      res = await deleteRecoveryRequest(request._id.toString());
      expect(res.success).toBe(true);
      const deleted = await RecoveryRequest.findById(request._id);
      expect(deleted).toBeNull();
    });
  });

  describe("getCloudinaryUploadSignature", () => {
    it("should return valid JWT signature for Cloudinary upload", async () => {
      const res = await getCloudinaryUploadSignature();
      expect(res.success).toBe(true);
      expect(res.signature).toBeDefined();
      expect(res.timestamp).toBeDefined();
    });
  });
});

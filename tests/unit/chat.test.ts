import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

// Unmock chat actions for this test file so we test the real functions
vi.unmock("@/features/chat/actions");

import {
  uploadChatImage,
  deleteChatImages,
  getFirebaseCustomToken,
  sendChatWebhookNotification,
} from "@/features/chat/actions";
import { auth } from "@/auth";

// Mock Cloudinary helpers
vi.mock("@/lib/cloudinary", () => ({
  uploadToCloudinary: vi.fn().mockResolvedValue("https://example.com/chat.jpg"),
  deleteFromCloudinary: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Firebase Admin Auth
vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn().mockReturnValue({
    createCustomToken: vi.fn().mockResolvedValue("mock-firebase-custom-token"),
  }),
}));

describe("Chat Server Actions & Console Chat Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      text: async () => "OK",
    } as any);
  });

  describe("uploadChatImage", () => {
    it("should fail if user is unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await uploadChatImage("data:image/png;base64,bits");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized");
    });

    it("should succeed and return Cloudinary image URL for authenticated users", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user1" }, expires: "9999" } as any);
      const res = await uploadChatImage("data:image/png;base64,bits");
      expect(res.success).toBe(true);
      expect(res.url).toBe("https://example.com/chat.jpg");
    });
  });

  describe("deleteChatImages", () => {
    it("should fail if role is not ADMIN or SUPER_ADMIN", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user1", role: "USER" }, expires: "9999" } as any);
      const res = await deleteChatImages(["https://example.com/chat.jpg"]);
      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized");
    });

    it("should delete images successfully for ADMIN", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" }, expires: "9999" } as any);
      const res = await deleteChatImages(["https://example.com/chat.jpg"]);
      expect(res.success).toBe(true);
    });
  });

  describe("getFirebaseCustomToken", () => {
    it("should fail if user is unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await getFirebaseCustomToken();
      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized");
    });

    it("should return custom token for authenticated user session", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user123", role: "USER" }, expires: "9999" } as any);
      const res = await getFirebaseCustomToken();
      expect(res.success).toBe(true);
      expect(res.customToken).toBe("mock-firebase-custom-token");
    });
  });

  describe("sendChatWebhookNotification", () => {
    it("should block unauthorized webhook dispatch attempts", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await sendChatWebhookNotification({
        ticketId: "support-123",
        ticketTitle: "Help",
        senderName: "Ash",
        senderType: "user",
      });
      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized");
    });

    it("should succeed gracefully even when no external webhook envs are configured", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user1" }, expires: "9999" } as any);
      const res = await sendChatWebhookNotification({
        ticketId: "auction-99",
        ticketTitle: "Bid Notification",
        senderName: "Ash",
        senderType: "user",
        text: "BID PLACED $100",
      });
      expect(res.success).toBe(true);
    });
  });
});

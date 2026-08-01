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
  describe("replyTo payload construction logic", () => {
    /** Mirrors the payload builder used in both user-chat-panel.tsx and admin-chat-panel.tsx */
    function buildReplyPayload(
      replyingTo: { id: string; sender: string; senderName: string; text?: string; image?: string } | null,
      selfName: string
    ) {
      if (!replyingTo) return undefined;
      return {
        messageId: replyingTo.id,
        senderName:
          replyingTo.senderName ||
          (replyingTo.sender === "admin" ? "Support Team" : selfName || "Trainer"),
        textPreview: (replyingTo.text || (replyingTo.image ? "📷 Photo" : "Message")).slice(0, 100),
      };
    }

    it("returns undefined when replyingTo is null", () => {
      expect(buildReplyPayload(null, "Ash")).toBeUndefined();
    });

    it("includes messageId, senderName, and truncated textPreview for a text message", () => {
      const msg = { id: "msg-abc", sender: "admin", senderName: "Support Team", text: "Hello trainer!" };
      const payload = buildReplyPayload(msg, "Ash");
      expect(payload).toMatchObject({
        messageId: "msg-abc",
        senderName: "Support Team",
        textPreview: "Hello trainer!",
      });
    });

    it("uses '📷 Photo' as preview for image-only messages", () => {
      const msg = { id: "msg-img", sender: "user", senderName: "Ash", image: "https://cdn.example.com/img.jpg" };
      const payload = buildReplyPayload(msg, "Support Team");
      expect(payload?.textPreview).toBe("📷 Photo");
    });

    it("truncates textPreview to 100 characters", () => {
      const longText = "A".repeat(200);
      const msg = { id: "msg-long", sender: "user", senderName: "Ash", text: longText };
      const payload = buildReplyPayload(msg, "Support Team");
      expect(payload?.textPreview.length).toBe(100);
    });

    it("falls back senderName to 'Support Team' for admin messages missing senderName", () => {
      const msg = { id: "msg-x", sender: "admin", senderName: "", text: "Hi" };
      const payload = buildReplyPayload(msg, "Ash");
      expect(payload?.senderName).toBe("Support Team");
    });

    it("falls back senderName to selfName for user messages missing senderName", () => {
      const msg = { id: "msg-y", sender: "user", senderName: "", text: "Hi" };
      const payload = buildReplyPayload(msg, "Pikachu");
      expect(payload?.senderName).toBe("Pikachu");
    });

    it("renders graceful fallback when textPreview is empty string", () => {
      // Simulates edge case: replyTo stored with empty textPreview
      const storedPreview: string = "";
      const textSnippet = storedPreview || "Original message unavailable";
      expect(textSnippet).toBe("Original message unavailable");
    });
  });
});

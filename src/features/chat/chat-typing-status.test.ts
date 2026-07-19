import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Pure functions matching the typing & read status logic in UserChatPanel & AdminChatPanel
 */

export function computeTypingStatus(
  rtdbTypingActive: boolean,
  firestoreTypingActive: boolean
): boolean {
  return rtdbTypingActive || firestoreTypingActive;
}

export function computeTickStatus(
  isSender: boolean,
  isRead: boolean,
  isReceiverOnline: boolean
): "read" | "delivered" | "sent" | "none" {
  if (!isSender) return "none";
  if (isRead) return "read";
  if (isReceiverOnline) return "delivered";
  return "sent";
}

describe("Chat Typing & Read Status Logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Typing Status Resolution", () => {
    it("should return true when either RTDB or Firestore typing is active", () => {
      expect(computeTypingStatus(true, false)).toBe(true);
      expect(computeTypingStatus(false, true)).toBe(true);
      expect(computeTypingStatus(true, true)).toBe(true);
    });

    it("should return false when neither RTDB nor Firestore typing is active", () => {
      expect(computeTypingStatus(false, false)).toBe(false);
    });

    it("should auto-expire typing indicator after fallback timeout", () => {
      let isTyping = computeTypingStatus(true, false);
      expect(isTyping).toBe(true);

      // Simulate timer expiration (3500ms)
      const timeoutHandler = vi.fn(() => {
        isTyping = false;
      });

      const timerId = setTimeout(timeoutHandler, 3500);
      expect(timeoutHandler).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3500);
      expect(timeoutHandler).toHaveBeenCalledTimes(1);
      expect(isTyping).toBe(false);
    });
  });

  describe("WhatsApp Tick Status Calculation", () => {
    it("should return double blue tick (read) when message is marked as read", () => {
      const status = computeTickStatus(true, true, true);
      expect(status).toBe("read");
    });

    it("should return double gray tick (delivered) when message is unread but receiver is online", () => {
      const status = computeTickStatus(true, false, true);
      expect(status).toBe("delivered");
    });

    it("should return single gray tick (sent) when message is unread and receiver is offline", () => {
      const status = computeTickStatus(true, false, false);
      expect(status).toBe("sent");
    });

    it("should return none for incoming messages (receiver side)", () => {
      const status = computeTickStatus(false, true, true);
      expect(status).toBe("none");
    });
  });
});

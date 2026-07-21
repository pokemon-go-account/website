import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import {
  submitContactMessage,
  getContactMessages,
  updateContactMessageStatus,
} from "@/features/contact/actions";
import {
  joinWaitlist,
  getWaitlistEmails,
  deleteWaitlistEntry,
} from "@/features/waitlist/actions";
import ContactMessage from "@/models/ContactMessage";
import Waitlist from "@/models/Waitlist";
import { auth } from "@/auth";

describe("Contact Form & Waitlist Console Actions", () => {
  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await ContactMessage.deleteMany({});
    await Waitlist.deleteMany({});
    vi.clearAllMocks();
  });

  describe("Contact Form & Console Contact Actions", () => {
    it("should submit contact message successfully and validate input bounds", async () => {
      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("email", "john@example.com");
      formData.append("subject", "General Inquiry");
      formData.append("message", "I have a question about account transfers.");

      const res = await submitContactMessage(null, formData);
      expect(res.success).toBe(true);

      const msg = await ContactMessage.findOne({ email: "john@example.com" });
      expect(msg).not.toBeNull();
      expect(msg?.subject).toBe("General Inquiry");
    });

    it("should fail contact submission on invalid schema inputs", async () => {
      const formData = new FormData();
      formData.append("name", "J");
      formData.append("email", "invalid-email");
      formData.append("subject", "");
      formData.append("message", "Short");

      const res = await submitContactMessage(null, formData);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it("should restrict getContactMessages and updateContactMessageStatus to SUPER_ADMIN", async () => {
      // Create test contact message
      const msg = (await ContactMessage.create({
        name: "Alice",
        email: "alice@example.com",
        subject: "Support",
        message: "Need help with my account.",
        status: "UNREAD",
      })) as any;

      // Fail for non-superadmin
      vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" }, expires: "9999" } as any);
      let listRes = await getContactMessages();
      expect(listRes.success).toBe(false);

      let updateRes = await updateContactMessageStatus(msg._id.toString(), "READ");
      expect(updateRes.success).toBe(false);

      // Succeed for SUPER_ADMIN
      vi.mocked(auth).mockResolvedValue({ user: { id: "super1", role: "SUPER_ADMIN" }, expires: "9999" } as any);
      listRes = await getContactMessages();
      expect(listRes.success).toBe(true);
      expect(listRes.messages?.length).toBe(1);

      updateRes = await updateContactMessageStatus(msg._id.toString(), "READ");
      expect(updateRes.success).toBe(true);

      const updated = await ContactMessage.findById(msg._id);
      expect(updated?.status).toBe("READ");
    });
  });

  describe("Waitlist Console & Public Actions", () => {
    it("should join waitlist and reject invalid or duplicate emails", async () => {
      // Invalid email
      let res = await joinWaitlist("notanemail");
      expect(res.success).toBe(false);

      // Success
      res = await joinWaitlist("earlybird@example.com");
      expect(res.success).toBe(true);

      // Duplicate
      res = await joinWaitlist("earlybird@example.com");
      expect(res.success).toBe(false);
      expect(res.error).toContain("already on the waitlist");
    });

    it("should allow SUPER_ADMIN to view and delete waitlist entries", async () => {
      await Waitlist.create({ email: "tester@example.com" });

      // Non-superadmin blocked
      vi.mocked(auth).mockResolvedValue({ user: { id: "user1", role: "USER" }, expires: "9999" } as any);
      let getRes = await getWaitlistEmails();
      expect(getRes.success).toBe(false);

      // SUPER_ADMIN allowed
      vi.mocked(auth).mockResolvedValue({ user: { id: "super1", role: "SUPER_ADMIN" }, expires: "9999" } as any);
      getRes = await getWaitlistEmails();
      expect(getRes.success).toBe(true);
      expect(getRes.emails?.length).toBe(1);

      // Delete entry
      const delRes = await deleteWaitlistEntry("tester@example.com");
      expect(delRes.success).toBe(true);

      const remaining = await Waitlist.findOne({ email: "tester@example.com" });
      expect(remaining).toBeNull();
    });
  });
});

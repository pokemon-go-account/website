import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { completeUserProfile } from "@/features/auth/actions";
import User from "@/models/User";
import { auth } from "@/auth";

describe("completeUserProfile - hearAboutUs Field & Validation", () => {
  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    vi.clearAllMocks();
  });

  it("should successfully save profile with a valid hearAboutUs option", async () => {
    const user = (await User.create({
      name: "Test Trainer",
      email: "trainer@example.com",
      username: "testtrainer",
      isOnboarded: false,
    })) as any;

    vi.mocked(auth).mockResolvedValue({
      user: { id: user._id.toString(), email: "trainer@example.com" },
      expires: "9999",
    } as any);

    const formData = new FormData();
    formData.append("name", "Test Trainer");
    formData.append("preferredContactMethod", "telegram");
    formData.append("preferredContactId", "@testtrainer");
    formData.append("country", "United States");
    formData.append("hearAboutUs", "Reddit");

    const res = await completeUserProfile(null, formData);
    expect(res.success).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.hearAboutUs).toBe("Reddit");
    expect(updatedUser?.isOnboarded).toBe(true);
  });

  it("should reject invalid/unexpected hearAboutUs value", async () => {
    const user = (await User.create({
      name: "Test Trainer",
      email: "trainer2@example.com",
      username: "testtrainer2",
      isOnboarded: false,
    })) as any;

    vi.mocked(auth).mockResolvedValue({
      user: { id: user._id.toString(), email: "trainer2@example.com" },
      expires: "9999",
    } as any);

    const formData = new FormData();
    formData.append("name", "Test Trainer");
    formData.append("preferredContactMethod", "telegram");
    formData.append("preferredContactId", "@testtrainer2");
    formData.append("country", "United States");
    formData.append("hearAboutUs", "TikTokChannel");

    const res = await completeUserProfile(null, formData);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Invalid selection");

    const unchangedUser = await User.findById(user._id);
    expect(unchangedUser?.isOnboarded).toBe(false);
  });

  it("should permit existing users without hearAboutUs on read", async () => {
    const user = (await User.create({
      name: "Existing User",
      email: "existing@example.com",
      username: "existinguser",
      isOnboarded: true,
      country: "Canada",
    })) as any;

    const fetchedUser = await User.findById(user._id).lean();
    expect(fetchedUser).not.toBeNull();
    expect(fetchedUser?.username).toBe("existinguser");
    // hearAboutUs defaults to empty string or undefined without breaking
    expect(fetchedUser?.hearAboutUs === "" || fetchedUser?.hearAboutUs === undefined).toBe(true);
  });
});

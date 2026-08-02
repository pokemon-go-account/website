import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { uploadToR2, deleteFromR2, extractR2Key, uploadToImages, deleteFromImages, extractImageId } from "@/lib/cloudflare-r2";

describe("Cloudflare R2 Object Storage Module", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("extractR2Key & extractImageId", () => {
    it("should extract R2 key from r2.dev public URL", () => {
      const url = "https://pub-260a0d7b7335fef1f8d7edf667de745c.r2.dev/uploads/12345-abc.png";
      expect(extractR2Key(url)).toBe("uploads/12345-abc.png");
      expect(extractImageId(url)).toBe("uploads/12345-abc.png");
    });

    it("should extract R2 key from r2.cloudflarestorage.com URL", () => {
      const url = "https://260a0d7b7335fef1f8d7edf667de745c.r2.cloudflarestorage.com/pokemon-go-auctions/uploads/12345-abc.png";
      expect(extractR2Key(url)).toBe("pokemon-go-auctions/uploads/12345-abc.png");
    });

    it("should return null for malformed or external URLs without throwing", () => {
      expect(extractR2Key("https://res.cloudinary.com/test/image.jpg")).toBeNull();
      expect(extractR2Key("invalid-url-string")).toBeNull();
      expect(extractR2Key("")).toBeNull();
      expect(extractR2Key(null as any)).toBeNull();
      expect(extractR2Key(undefined as any)).toBeNull();
    });
  });

  describe("unconfigured environment fallback", () => {
    it("should fall back gracefully without throwing when env vars are unconfigured", async () => {
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;
      delete process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

      const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const resUrl = await uploadToR2(base64Data);
      expect(resUrl).toBe(base64Data);

      const aliasUrl = await uploadToImages(base64Data);
      expect(aliasUrl).toBe(base64Data);
    });

    it("should return mock image for non-data-URL input when unconfigured", async () => {
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;

      const resUrl = await uploadToR2("raw_base64_string_without_prefix");
      expect(resUrl).toMatch(/^https:\/\//);
    });

    it("should silently no-op delete when unconfigured", async () => {
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;

      await expect(deleteFromR2("https://pub-260a0d7b.r2.dev/uploads/123.png")).resolves.toBeUndefined();
      await expect(deleteFromImages("https://pub-260a0d7b.r2.dev/uploads/123.png")).resolves.toBeUndefined();
    });
  });
});

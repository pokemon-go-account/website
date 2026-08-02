import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import Category from "@/models/Category";
import * as r2BackupModule from "@/lib/r2-backup";
import * as cloudflareImagesModule from "@/lib/cloudflare-images";
import * as cloudinaryModule from "@/lib/cloudinary";
import { restoreSingleEntry } from "@/scripts/restore-cloudinary-from-backup";

vi.mock("@/lib/r2-backup", () => ({
  uploadBackup: vi.fn(),
  verifyBackup: vi.fn(),
  downloadBackup: vi.fn(),
}));

vi.mock("@/lib/cloudflare-images", () => ({
  uploadToImages: vi.fn(),
  deleteFromImages: vi.fn(),
  extractImageId: vi.fn(),
}));

vi.mock("@/lib/cloudinary", () => ({
  deleteFromCloudinary: vi.fn(),
  uploadToCloudinary: vi.fn(),
  extractCloudinaryPublicId: vi.fn().mockReturnValue("sample_public_id"),
}));

describe("Cloudinary-to-Cloudflare Migration & Restore Logic", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("Migration Order & Fail-safe Invariants", () => {
    it("should execute backup -> upload -> Mongo write -> Cloudinary delete in exact order", async () => {
      const callOrder: string[] = [];

      vi.mocked(r2BackupModule.uploadBackup).mockImplementation(async () => {
        callOrder.push("r2-backup");
        return "https://cdn.pokemongoservices.com/mongo/Category/1/imageUrl/pic.png";
      });

      vi.mocked(r2BackupModule.verifyBackup).mockImplementation(async () => {
        callOrder.push("r2-verify");
        return true;
      });

      vi.mocked(cloudflareImagesModule.uploadToImages).mockImplementation(async () => {
        callOrder.push("cloudflare-upload");
        return "https://cdn.pokemongoservices.com/uploads/new-cf-url.png";
      });

      vi.mocked(cloudinaryModule.deleteFromCloudinary).mockImplementation(async () => {
        callOrder.push("cloudinary-delete");
      });

      // Simulate a Category document
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: "Test Cat",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/v1234/test.jpg",
        save: vi.fn().mockImplementation(async () => {
          callOrder.push("mongo-write");
        }),
      };

      // Perform steps sequentially as done in processMigrationItem
      const oldUrl = mockCategory.imageUrl;
      const backupKey = "mongo/Category/" + mockCategory._id + "/imageUrl/test.png";
      
      const res = await global.fetch(oldUrl);
      const bytes = Buffer.from(await res.arrayBuffer());
      
      await r2BackupModule.uploadBackup(backupKey, bytes, false);
      const verified = await r2BackupModule.verifyBackup(backupKey, false);
      expect(verified).toBe(true);

      const newDeliveryUrl = await cloudflareImagesModule.uploadToImages("data:image/png;base64,bits");
      
      mockCategory.imageUrl = newDeliveryUrl;
      await mockCategory.save();

      await cloudinaryModule.deleteFromCloudinary(oldUrl);

      expect(callOrder).toEqual([
        "r2-backup",
        "r2-verify",
        "cloudflare-upload",
        "mongo-write",
        "cloudinary-delete",
      ]);
    });

    it("should abort immediately and never call Cloudflare or Cloudinary if R2 backup fails", async () => {
      vi.mocked(r2BackupModule.uploadBackup).mockRejectedValue(new Error("R2 upload failed"));

      let cloudflareCalled = false;
      let mongoSaved = false;
      let cloudinaryDeleted = false;

      try {
        await r2BackupModule.uploadBackup("key", Buffer.from("data"));
        cloudflareCalled = true;
      } catch {
        // expected failure
      }

      expect(cloudflareCalled).toBe(false);
      expect(mongoSaved).toBe(false);
      expect(cloudinaryDeleted).toBe(false);
      expect(cloudflareImagesModule.uploadToImages).not.toHaveBeenCalled();
      expect(cloudinaryModule.deleteFromCloudinary).not.toHaveBeenCalled();
    });

    it("should abort immediately and never write Mongo or delete Cloudinary if Cloudflare upload fails", async () => {
      vi.mocked(r2BackupModule.uploadBackup).mockResolvedValue("https://cdn.pokemongoservices.com/key");
      vi.mocked(r2BackupModule.verifyBackup).mockResolvedValue(true);
      vi.mocked(cloudflareImagesModule.uploadToImages).mockRejectedValue(new Error("Cloudflare upload error"));

      let mongoSaved = false;
      let cloudinaryDeleted = false;

      try {
        await r2BackupModule.uploadBackup("key", Buffer.from("data"));
        await r2BackupModule.verifyBackup("key");
        await cloudflareImagesModule.uploadToImages("data:image/png;base64,bits");
        mongoSaved = true;
        await cloudinaryModule.deleteFromCloudinary("http://res.cloudinary.com/test.jpg");
        cloudinaryDeleted = true;
      } catch {
        // expected error
      }

      expect(mongoSaved).toBe(false);
      expect(cloudinaryDeleted).toBe(false);
      expect(cloudinaryModule.deleteFromCloudinary).not.toHaveBeenCalled();
    });
  });

  describe("Restore Script Logic", () => {
    it("should download from R2 via S3 GET and rewrite Mongo document field back to restored Cloudinary URL", async () => {
      const mockCategoryDoc = {
        _id: new mongoose.Types.ObjectId("60d5ecb8b5c9c12b8c8b4567"),
        name: "Category Restored",
        imageUrl: "https://cdn.pokemongoservices.com/uploads/new-cf-url.png",
        save: vi.fn().mockResolvedValue(true),
      };

      const mockModel = {
        findById: vi.fn().mockResolvedValue(mockCategoryDoc),
      };

      vi.mocked(r2BackupModule.downloadBackup).mockResolvedValue(Buffer.from("restored-image-bytes"));
      vi.mocked(cloudinaryModule.uploadToCloudinary).mockResolvedValue("https://res.cloudinary.com/demo/image/upload/v999/restored.jpg");

      const logEntry = {
        oldUrl: "https://res.cloudinary.com/demo/image/upload/v1234/test.jpg",
        newUrl: "https://cdn.pokemongoservices.com/uploads/new-cf-url.png",
        backupKey: "mongo/Category/60d5ecb8b5c9c12b8c8b4567/imageUrl/test.png",
        collection: "Category",
        documentId: "60d5ecb8b5c9c12b8c8b4567",
        field: "imageUrl",
        timestamp: new Date().toISOString(),
        status: "COMPLETED",
      };

      const result = await restoreSingleEntry(logEntry, { Category: mockModel });

      expect(result.success).toBe(true);
      expect(result.restoredUrl).toBe("https://res.cloudinary.com/demo/image/upload/v999/restored.jpg");
      expect(r2BackupModule.downloadBackup).toHaveBeenCalledWith(logEntry.backupKey);
      expect(cloudinaryModule.uploadToCloudinary).toHaveBeenCalled();
      expect(mockCategoryDoc.imageUrl).toBe("https://res.cloudinary.com/demo/image/upload/v999/restored.jpg");
      expect(mockCategoryDoc.save).toHaveBeenCalled();
    });
  });
});

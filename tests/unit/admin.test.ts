import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import {
  approveListing,
  rejectListing,
  pauseAuction,
  resumeAuction,
  forceEndAuction,
  reactivateAuction,
  rollbackAuctionBid,
  updateEscrowStage,
  saveListingCredentials,
  releaseEscrowFunds,
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  updatePokemonRequestStatus,
  updateCustomRequestStatus,
} from "@/features/admin/actions";
import Listing from "@/models/Listing";
import Auction from "@/models/Auction";
import Bid from "@/models/Bid";
import User from "@/models/User";
import Category from "@/models/Category";
import Product from "@/models/Product";
import PokemonRequest from "@/models/PokemonRequest";
import CustomRequest from "@/models/CustomRequest";
import { auth } from "@/auth";

// Mock Cloudinary helpers
vi.mock("@/lib/cloudinary", () => ({
  deleteFromCloudinary: vi.fn().mockResolvedValue({ success: true }),
  uploadToCloudinary: vi.fn().mockResolvedValue({ success: true, secure_url: "https://example.com/uploaded.jpg" }),
}));

const LISTING_FIXTURE = {
  title: "Admin Test Account",
  description: "Detailed account description",
  telegramUsername: "admin_tester",
  level: 45,
  xp: 15000000,
  stardust: 1000000,
  team: "VALOR" as const,
  shinyCount: 15,
  legendaryCount: 20,
  mythicalCount: 5,
  region: "Global",
  screenshots: ["https://example.com/ss1.jpg"],
  startingBid: 20,
  reservePrice: 50,
  minIncrement: 5,
  durationHours: 12,
  startDate: "2016-07-05",
  accountType: "Regular",
  accountStatus: "Good Standing",
};

describe("Admin Actions", () => {
  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Listing.deleteMany({});
    await Auction.deleteMany({});
    await Bid.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await PokemonRequest.deleteMany({});
    await CustomRequest.deleteMany({});
    vi.clearAllMocks();
  });

  describe("Security/Role Gates", () => {
    it("should fail to approve listing if role is USER", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user1", role: "USER" }, expires: "9999" } as any);
      const res = await approveListing("507f1f77bcf86cd799439011");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });
  });

  describe("Listing Operations", () => {
    it("should successfully approve listing and create a LIVE auction", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const listing = (await Listing.create({
        ...LISTING_FIXTURE,
        sellerId: new mongoose.Types.ObjectId(),
        status: "PENDING",
      })) as any;

      const res = await approveListing(listing._id.toString());
      expect(res.success).toBe(true);

      const updatedListing = await Listing.findById(listing._id);
      expect(updatedListing?.status).toBe("APPROVED");
      expect(updatedListing?.escrowStage).toBe("APPROVED");

      const auction = await Auction.findOne({ listingId: listing._id });
      expect(auction).not.toBeNull();
      expect(auction?.status).toBe("LIVE");
    });

    it("should successfully reject listing", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const listing = (await Listing.create({
        ...LISTING_FIXTURE,
        sellerId: new mongoose.Types.ObjectId(),
        status: "PENDING",
      })) as any;

      const res = await rejectListing(listing._id.toString(), "Incomplete screenshots");
      expect(res.success).toBe(true);

      const updated = await Listing.findById(listing._id);
      expect(updated?.status).toBe("REJECTED");
      expect(updated?.adminNotes).toBe("Incomplete screenshots");
    });
  });

  describe("Auction Operations", () => {
    it("should pause, resume, and force-end a live auction", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const listing = (await Listing.create({
        ...LISTING_FIXTURE,
        sellerId: new mongoose.Types.ObjectId(),
        status: "APPROVED",
      })) as any;

      const auction = (await Auction.create({
        listingId: listing._id,
        status: "LIVE",
        currentHighestBid: 20,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
      })) as any;

      // Pause
      let res = await pauseAuction(auction._id.toString());
      expect(res.success).toBe(true);
      let updated = await Auction.findById(auction._id);
      expect(updated?.status).toBe("PAUSED");

      // Resume
      res = await resumeAuction(auction._id.toString());
      expect(res.success).toBe(true);
      updated = await Auction.findById(auction._id);
      expect(updated?.status).toBe("LIVE");

      // Force End
      res = await forceEndAuction(auction._id.toString());
      expect(res.success).toBe(true);
      updated = await Auction.findById(auction._id);
      expect(updated?.status).toBe("COMPLETED");
    });
  });

  describe("Category & Product Catalog Operations", () => {
    it("should manage categories CRUD successfully", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "SUPER_ADMIN" }, expires: "9999" } as any);

      // Create
      let res: any = await createCategory("Accounts", "accounts");
      expect(res.success).toBe(true);
      let cat = (await Category.findOne({ slug: "accounts" })) as any;
      expect(cat).not.toBeNull();

      // Update
      res = await updateCategory(cat!._id.toString(), "Premium Accounts", "premium-accounts");
      expect(res.success).toBe(true);
      cat = await Category.findById(cat!._id);
      expect(cat?.name).toBe("Premium Accounts");
      expect(cat?.slug).toBe("premium-accounts");

      // Delete
      res = await deleteCategory(cat!._id.toString());
      expect(res.success).toBe(true);
      cat = await Category.findById(cat!._id);
      expect(cat).toBeNull();
    });

    it("should manage products CRUD successfully", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const cat = (await Category.create({ name: "Keys", slug: "keys" })) as any;

      // Create
      let res: any = await createProduct({
        name: "PGSharp Key",
        description: "1 Month subscription",
        mrpPrice: 10.0,
        discountedPrice: 5.0,
        categoryId: cat._id.toString(),
        imageUrl: "https://example.com/key.png",
      });
      expect(res.success).toBe(true);
      let prod = (await Product.findOne({ name: "PGSharp Key" })) as any;
      expect(prod).not.toBeNull();

      // Update
      res = await updateProduct(prod!._id.toString(), {
        name: "PGSharp Key Pro",
        description: "1 Month subscription",
        mrpPrice: 10.0,
        discountedPrice: 7.0,
        categoryId: cat._id.toString(),
        imageUrl: "https://example.com/key.png",
      });
      expect(res.success).toBe(true);
      prod = await Product.findById(prod!._id);
      expect(prod?.name).toBe("PGSharp Key Pro");
      expect(prod?.discountedPrice).toBe(7.0);

      // Delete
      res = await deleteProduct(prod!._id.toString());
      expect(res.success).toBe(true);
      prod = await Product.findById(prod!._id);
      expect(prod).toBeNull();
    });
  });

  describe("Request Operations", () => {
    it("should update Pokemon and Custom request statuses", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const pReq = (await PokemonRequest.create({
        userId: new mongoose.Types.ObjectId(),
        username: "test",
        email: "test@example.com",
        pokemonName: "Mewtwo",
        description: "Need Shiny Mewtwo",
        socialPlatform: "Discord",
        socialId: "test#123",
        status: "PENDING",
      })) as any;

      const cReq = (await CustomRequest.create({
        userId: new mongoose.Types.ObjectId(),
        username: "test",
        email: "test@example.com",
        requestType: "STARDUST",
        title: "Buy stardust",
        description: "Need 1M stardust",
        socialPlatform: "Discord",
        socialId: "test#123",
        status: "PENDING",
      })) as any;

      // Update Pokemon Request
      let res = await updatePokemonRequestStatus(pReq._id.toString(), "COMPLETED");
      expect(res.success).toBe(true);
      const updatedPReq = await PokemonRequest.findById(pReq._id);
      expect(updatedPReq?.status).toBe("COMPLETED");

      // Update Custom Request
      res = await updateCustomRequestStatus(cReq._id.toString(), "REJECTED");
      expect(res.success).toBe(true);
      const updatedCReq = await CustomRequest.findById(cReq._id);
      expect(updatedCReq?.status).toBe("REJECTED");
    });
  });
});

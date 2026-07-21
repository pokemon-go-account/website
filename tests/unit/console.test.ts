import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import {
  promoteToAdmin,
  demoteToUser,
  toggleUserSuspension,
  markRentPaid,
  verifyRegistrationConsole,
  failRegistrationConsole,
  completeOrderConsole,
  failOrderConsole,
  updateUserWalletBalance,
  searchUserByUsername,
  getAllAdmins,
  getPendingAuctionListings,
  approveListingConsole,
  rejectListingConsole,
  updateListingConsole,
  getRegistrationsConsole,
  deleteRegistrationConsole,
  getOrdersConsole,
  deleteOrderConsole,
  createRegistrationManuallyConsole,
  cancelOrderUser,
  getAllUsers,
  getConcludedAuctions,
  markAuctionPaymentReceived,
  markAuctionDelivered,
  getTotalRevenueConsole,
} from "@/features/console/actions";
import User from "@/models/User";
import AdminRent from "@/models/AdminRent";
import Order from "@/models/Order";
import Registration from "@/models/Registration";
import Auction from "@/models/Auction";
import Listing from "@/models/Listing";
import { auth } from "@/auth";

const USER_FIXTURE = {
  name: "Test User",
  username: "testuser",
  email: "testuser@example.com",
  role: "USER" as const,
};

const SUPER_ADMIN_ID = "507f1f77bcf86cd799439011";

describe("Console Actions", () => {
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
    await AdminRent.deleteMany({});
    await Order.deleteMany({});
    await Registration.deleteMany({});
    await Auction.deleteMany({});
    await Listing.deleteMany({});
    vi.clearAllMocks();
  });

  describe("Security/Role Gates", () => {
    it("should fail promoteToAdmin if session is not SUPER_ADMIN", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user1", role: "USER" }, expires: "9999" } as any);
      const res = await promoteToAdmin("507f1f77bcf86cd799439011");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });
  });

  describe("User Management & Search Operations", () => {
    it("should promote and demote a user successfully", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: SUPER_ADMIN_ID, role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const user = (await User.create(USER_FIXTURE)) as any;

      // Promote
      let res = await promoteToAdmin(user._id.toString());
      expect(res.success).toBe(true);
      let updated = await User.findById(user._id);
      expect(updated?.role).toBe("ADMIN");
      expect(updated?.adminRentPaidUntil).not.toBeNull();

      // Demote
      res = await demoteToUser(user._id.toString());
      expect(res.success).toBe(true);
      updated = await User.findById(user._id);
      expect(updated?.role).toBe("USER");
      expect(updated?.adminRentPaidUntil).toBeNull();
    });

    it("should suspend and unsuspend a user successfully", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: SUPER_ADMIN_ID, role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const user = (await User.create(USER_FIXTURE)) as any;

      // Suspend
      let res = await toggleUserSuspension(user._id.toString(), true);
      expect(res.success).toBe(true);
      let updated = await User.findById(user._id);
      expect(updated?.isSuspended).toBe(true);

      // Unsuspend
      res = await toggleUserSuspension(user._id.toString(), false);
      expect(res.success).toBe(true);
      updated = await User.findById(user._id);
      expect(updated?.isSuspended).toBe(false);
    });

    it("should update user wallet balance successfully", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: SUPER_ADMIN_ID, role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const user = (await User.create(USER_FIXTURE)) as any;

      const res = await updateUserWalletBalance(user._id.toString(), 250.5);
      expect(res.success).toBe(true);

      const updated = await User.findById(user._id);
      expect(updated?.walletBalance).toBe(250.5);
    });

    it("should search user by username and fetch all admins and all users with filter", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: SUPER_ADMIN_ID, role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const u1 = await User.create({ name: "Ash", username: "ashketchum", email: "ash@example.com", role: "USER" });
      const u2 = await User.create({ name: "Misty", username: "mistywater", email: "misty@example.com", role: "ADMIN" });

      // Search user by username
      const found = await searchUserByUsername("ashketchum");
      expect(found.success).toBe(true);
      expect(found.user?.username).toBe("ashketchum");

      // Search user by non-existent username
      const notFound = await searchUserByUsername("brock");
      expect(notFound.success).toBe(false);

      // Get all admins
      const adminsRes = await getAllAdmins();
      expect(adminsRes.success).toBe(true);
      expect(adminsRes.admins?.length).toBe(1);
      expect(adminsRes.admins?.[0].username).toBe("mistywater");

      // Get all users paginated with search filter
      const usersRes = await getAllUsers(1, 10, "ash");
      expect(usersRes.success).toBe(true);
      expect(usersRes.users?.length).toBe(1);
      expect(usersRes.users?.[0].username).toBe("ashketchum");
    });
  });

  describe("Admin Rent Tracking", () => {
    it("should mark rent paid and extend paid expiry", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: SUPER_ADMIN_ID, role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const admin = (await User.create({
        ...USER_FIXTURE,
        role: "ADMIN" as const,
        adminRentPaidUntil: new Date(),
      })) as any;

      const res = await markRentPaid(admin._id.toString());
      expect(res.success).toBe(true);

      const updated = await User.findById(admin._id);
      expect(updated?.adminRentPaidUntil).not.toBeNull();

      const rentRecord = await AdminRent.findOne({ adminId: admin._id });
      expect(rentRecord).not.toBeNull();
      expect(rentRecord?.status).toBe("PAID");
    });
  });

  describe("Listing Console Operations", () => {
    it("should get pending listings, approve, reject, and update listing console properties", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: SUPER_ADMIN_ID, role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const listing = (await Listing.create({
        title: "Console Test Listing",
        description: "Listing description",
        telegramUsername: "tg_console",
        level: 35,
        xp: 5000000,
        stardust: 200000,
        team: "INSTINCT",
        shinyCount: 2,
        legendaryCount: 2,
        mythicalCount: 1,
        region: "US",
        screenshots: ["https://example.com/ss.jpg"],
        startingBid: 15,
        reservePrice: 30,
        minIncrement: 5,
        durationHours: 12,
        startDate: "2016-07-05",
        status: "PENDING",
        accountType: "Regular",
        accountStatus: "Good Standing",
        sellerId: new mongoose.Types.ObjectId(),
      })) as any;

      // Get pending auction listings
      const pendingRes = await getPendingAuctionListings();
      expect(pendingRes.success).toBe(true);
      expect(pendingRes.listings?.length).toBe(1);

      // Update listing console
      const updateRes = await updateListingConsole(listing._id.toString(), { level: 40 });
      expect(updateRes.success).toBe(true);

      // Approve listing console
      const approveRes = await approveListingConsole(listing._id.toString(), "Approved via console");
      expect(approveRes.success).toBe(true);

      let updated = await Listing.findById(listing._id);
      expect(updated?.status).toBe("APPROVED");
      expect(updated?.level).toBe(40);
    });
  });

  describe("Registration & Order Console Operations", () => {
    it("should manage registration status, manual registration creation, and deletion", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: SUPER_ADMIN_ID, role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const bidder = (await User.create(USER_FIXTURE)) as any;

      // Create manual registration via console
      const manualRes = await createRegistrationManuallyConsole("testuser");
      expect(manualRes.success).toBe(true);

      const regList = await getRegistrationsConsole(1, 10, "PENDING");
      expect(regList.success).toBe(true);

      const reg = await Registration.findOne({ userId: bidder._id });
      expect(reg).not.toBeNull();

      // Delete registration console
      const delRes = await deleteRegistrationConsole(reg!._id.toString());
      expect(delRes.success).toBe(true);

      const deleted = await Registration.findById(reg!._id);
      expect(deleted).toBeNull();
    });

    it("should complete, fail, and delete order console operations", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: SUPER_ADMIN_ID, role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const buyer = (await User.create(USER_FIXTURE)) as any;
      const order = (await Order.create({
        userId: buyer._id,
        items: [{ name: "PokeCoins", price: 10, quantity: 1 }],
        totalPrice: 10,
        status: "PENDING",
        orderType: "STOREFRONT",
      })) as any;

      // Get orders console (search = "", status = "PENDING")
      const ordersRes = await getOrdersConsole(1, 10, "", "PENDING");
      expect(ordersRes.success).toBe(true);
      expect(ordersRes.orders?.length).toBe(1);

      // Fail order console
      const failRes = await failOrderConsole(order._id.toString());
      expect(failRes.success).toBe(true);
      let updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.status).toBe("FAILED");

      // Delete order console
      const delOrderRes = await deleteOrderConsole(order._id.toString());
      expect(delOrderRes.success).toBe(true);
      updatedOrder = await Order.findById(order._id);
      expect(updatedOrder).toBeNull();
    });

    it("should allow a standard user to cancel their own PENDING order with wallet refund", async () => {
      const user = (await User.create({
        ...USER_FIXTURE,
        walletBalance: 0,
      })) as any;

      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString(), role: "USER" }, expires: "9999" } as any);

      const order = (await Order.create({
        userId: user._id,
        items: [{ name: "Items", price: 20, quantity: 1 }],
        totalPrice: 17.5,
        walletDiscountApplied: 2.5,
        status: "PENDING",
        orderType: "STOREFRONT",
      })) as any;

      const res = await cancelOrderUser(order._id.toString());
      expect(res.success).toBe(true);

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.status).toBe("FAILED");

      // Wallet balance should be refunded by $2.50
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.walletBalance).toBe(2.5);
    });
  });

  describe("Concluded Auctions, Delivery Status, and Revenue Calculation", () => {
    it("should mark payment received, delivery completed, and aggregate total revenue", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: SUPER_ADMIN_ID, role: "SUPER_ADMIN" }, expires: "9999" } as any);

      const buyer = (await User.create(USER_FIXTURE)) as any;

      const order1 = (await Order.create({
        userId: buyer._id,
        items: [{ name: "Account A", price: 100, quantity: 1 }],
        totalPrice: 100,
        status: "COMPLETED",
        orderType: "AUCTION",
      })) as any;

      const order2 = (await Order.create({
        userId: buyer._id,
        items: [{ name: "Account B", price: 150, quantity: 1 }],
        totalPrice: 150,
        status: "COMPLETED",
        orderType: "STOREFRONT",
      })) as any;

      // Mark payment received
      const payRes = await markAuctionPaymentReceived(order1._id.toString());
      expect(payRes.success).toBe(true);
      let updatedO1 = await Order.findById(order1._id);
      expect(updatedO1?.deliveryStatus).toBe("PAYMENT_RECEIVED");

      // Mark delivered
      const delivRes = await markAuctionDelivered(order1._id.toString());
      expect(delivRes.success).toBe(true);
      updatedO1 = await Order.findById(order1._id);
      expect(updatedO1?.deliveryStatus).toBe("DELIVERED");

      // Get total revenue
      const revRes = await getTotalRevenueConsole();
      expect(revRes.success).toBe(true);
      expect(revRes.totalRevenue).toBe(250); // 100 + 150
      expect(revRes.completedOrdersCount).toBe(2);
    });
  });
});

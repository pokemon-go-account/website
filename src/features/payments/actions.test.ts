import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import User from '@/models/User';
import Auction from '@/models/Auction';
import Listing from '@/models/Listing';
import Registration from '@/models/Registration';
import { auth } from '@/auth';
import {
  createRegistrationOrder,
  checkUserRegistrationStatus,
  simulateMockPayment,
} from './actions';

// ─── Mock Razorpay so we never hit the real gateway ──────────────────────
// Must be a class (constructable) because the production code uses `new Razorpay(...)`.
vi.mock('razorpay', () => ({
  default: class MockRazorpay {
    orders = {
      create: vi.fn().mockResolvedValue({
        id: 'order_live_test_123',
        amount: 250,
        currency: 'USD',
      }),
    };
  },
}));

// ─── Listing insertion helper ─────────────────────────────────────────────
// Listing.ts uses the Mongoose 3-arg pre('save') hook with a synchronous `next`
// callback — this throws in Mongoose 8 ("next is not a function").
// We bypass the hook entirely using a raw collection insert so our test fixtures
// can be created without triggering the broken model middleware.
// NOTE: this is test-infrastructure isolation, not a product fix.
async function insertListing(overrides: Record<string, unknown> = {}) {
  const result = await Listing.collection.insertOne({
    telegramUsername: 'seller_tg',
    title: 'Test Pokemon GO Account',
    description: 'Solid test account used in vitest',
    level: 40,
    xp: 10_000_000,
    stardust: 300_000,
    team: 'MYSTIC',
    shinyCount: 5,
    legendaryCount: 10,
    mythicalCount: 2,
    region: 'Global',
    screenshots: ['https://example.com/ss.jpg'],
    startingBid: 50,
    reservePrice: 100,
    minIncrement: 5,
    durationHours: 24,
    status: 'APPROVED',
    escrowStage: 'APPROVED',
    pokedexCompleted: 0, bestBuddyCount: 0, pokeCoins: 0,
    startDate: '2020-01-01', accountType: 'Regular', accountStatus: 'Good Standing',
    weeklyDistance: 0, rareCandy: 0, fastTm: 0, chargedTm: 0,
    eliteFastTm: 0, eliteChargedTm: 0, incubators: 0, luckyEggs: 0,
    lureModules: 0, premiumRaidPass: 0,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  });
  return { _id: result.insertedId };
}

describe('Payments Actions', () => {
  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }
  });

  afterAll(async () => {
    await Registration.deleteMany({});
    await Auction.deleteMany({});
    await Listing.collection.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Registration.deleteMany({});
    await Auction.deleteMany({});
    await Listing.collection.deleteMany({});
    await User.deleteMany({});
    vi.clearAllMocks();
    // Always reset to sandbox credentials so individual tests can override
    process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
    process.env.RAZORPAY_KEY_SECRET = 'secret_placeholder';
  });

  // ═══════════════════════════════════════════════════════════════════════
  // createRegistrationOrder
  // ═══════════════════════════════════════════════════════════════════════
  describe('createRegistrationOrder', () => {
    it('returns Unauthorized when there is no session', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await createRegistrationOrder(new mongoose.Types.ObjectId().toString());
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('returns error when the authenticated user does not exist in the DB', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: new mongoose.Types.ObjectId().toString() },
      } as any);
      const res = await createRegistrationOrder(new mongoose.Types.ObjectId().toString());
      expect(res.success).toBe(false);
      expect(res.error).toContain('User profile not found');
    });

    it('returns error when the user account is suspended', async () => {
      const user = await User.create({
        username: 'suspended', email: 'sus@t.com', role: 'USER', isSuspended: true,
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);
      const res = await createRegistrationOrder(new mongoose.Types.ObjectId().toString());
      expect(res.success).toBe(false);
      expect(res.error).toContain('suspended');
    });

    it('returns error when the auction ID does not exist', async () => {
      const user = await User.create({ username: 'u', email: 'u@t.com', role: 'USER' });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);
      const res = await createRegistrationOrder(new mongoose.Types.ObjectId().toString());
      expect(res.success).toBe(false);
      expect(res.error).toContain('Auction not found');
    });

    it('returns error when the auction is not LIVE or SCHEDULED', async () => {
      const seller = await User.create({ username: 's', email: 's@t.com', role: 'ADMIN' });
      const listing = await insertListing({ sellerId: seller._id });
      const auction = await Auction.create({
        listingId: listing._id, status: 'COMPLETED',
        currentHighestBid: 50, startTime: new Date(),
        endTime: new Date(Date.now() - 1_000),
      });
      const bidder = await User.create({ username: 'b', email: 'b@t.com', role: 'USER' });
      vi.mocked(auth).mockResolvedValue({ user: { id: bidder._id.toString() } } as any);

      const res = await createRegistrationOrder(auction._id.toString());
      expect(res.success).toBe(false);
      expect(res.error).toContain('not open for registration');
    });

    it('prevents a seller from registering for their own auction', async () => {
      const seller = await User.create({ username: 's', email: 's@t.com', role: 'ADMIN' });
      const listing = await insertListing({ sellerId: seller._id });
      const auction = await Auction.create({
        listingId: listing._id, status: 'LIVE',
        currentHighestBid: 50, startTime: new Date(),
        endTime: new Date(Date.now() + 100_000),
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: seller._id.toString() } } as any);

      const res = await createRegistrationOrder(auction._id.toString());
      expect(res.success).toBe(false);
      expect(res.error).toContain('cannot register for your own');
    });

    it('blocks re-registration when the user has already paid the verification deposit', async () => {
      const seller = await User.create({ username: 's', email: 's@t.com', role: 'ADMIN' });
      const bidder = await User.create({
        username: 'b', email: 'b@t.com', role: 'USER',
        hasPaidVerificationDeposit: true,
      });
      const listing = await insertListing({ sellerId: seller._id });
      const auction = await Auction.create({
        listingId: listing._id, status: 'LIVE',
        currentHighestBid: 50, startTime: new Date(),
        endTime: new Date(Date.now() + 100_000),
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: bidder._id.toString() } } as any);

      const res = await createRegistrationOrder(auction._id.toString());
      expect(res.success).toBe(false);
      expect(res.error).toContain('already paid');
    });

    it('returns an error when Razorpay credentials are absent from env', async () => {
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
      const seller = await User.create({ username: 's', email: 's@t.com', role: 'ADMIN' });
      const bidder = await User.create({ username: 'b', email: 'b@t.com', role: 'USER' });
      const listing = await insertListing({ sellerId: seller._id });
      const auction = await Auction.create({
        listingId: listing._id, status: 'LIVE',
        currentHighestBid: 50, startTime: new Date(),
        endTime: new Date(Date.now() + 100_000),
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: bidder._id.toString() } } as any);

      const res = await createRegistrationOrder(auction._id.toString());
      expect(res.success).toBe(false);
      expect(res.error).toContain('offline');
    });

    it('happy path — sandbox creates a mock order and persists a PENDING Registration', async () => {
      const seller = await User.create({ username: 's', email: 's@t.com', role: 'ADMIN' });
      const bidder = await User.create({ username: 'b', email: 'b@t.com', role: 'USER' });
      const listing = await insertListing({ sellerId: seller._id });
      const auction = await Auction.create({
        listingId: listing._id, status: 'LIVE',
        currentHighestBid: 50, startTime: new Date(),
        endTime: new Date(Date.now() + 100_000),
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: bidder._id.toString() } } as any);

      const res = await createRegistrationOrder(auction._id.toString());

      expect(res.success).toBe(true);
      expect(res.error).toBeNull();
      expect(res.isMock).toBe(true);
      expect(res.orderContext?.id).toMatch(/^order_mock_/);
      expect(res.orderContext?.amount).toBe(250);
      expect(res.orderContext?.currency).toBe('USD');
      expect(res.orderContext?.key_id).toBe('rzp_test_placeholder');

      const reg = await Registration.findOne({ userId: bidder._id, auctionId: auction._id });
      expect(reg).not.toBeNull();
      expect(reg?.status).toBe('PENDING');
      expect(reg?.razorpayOrderId).toMatch(/^order_mock_/);
    });

    it('re-uses an existing PENDING registration record and does not create a duplicate', async () => {
      const seller = await User.create({ username: 's', email: 's@t.com', role: 'ADMIN' });
      const bidder = await User.create({ username: 'b', email: 'b@t.com', role: 'USER' });
      const listing = await insertListing({ sellerId: seller._id });
      const auction = await Auction.create({
        listingId: listing._id, status: 'LIVE',
        currentHighestBid: 50, startTime: new Date(),
        endTime: new Date(Date.now() + 100_000),
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: bidder._id.toString() } } as any);

      const res1 = await createRegistrationOrder(auction._id.toString());
      expect(res1.success).toBe(true);

      const res2 = await createRegistrationOrder(auction._id.toString());
      expect(res2.success).toBe(true);

      // Two calls → still exactly one Registration document
      const count = await Registration.countDocuments({ userId: bidder._id, auctionId: auction._id });
      expect(count).toBe(1);
    });

    it('calls the live Razorpay SDK when credentials are not placeholder values', async () => {
      process.env.RAZORPAY_KEY_ID = 'rzp_test_realKey';
      process.env.RAZORPAY_KEY_SECRET = 'real_secret_value';
      const seller = await User.create({ username: 's', email: 's@t.com', role: 'ADMIN' });
      const bidder = await User.create({ username: 'b', email: 'b@t.com', role: 'USER' });
      const listing = await insertListing({ sellerId: seller._id });
      const auction = await Auction.create({
        listingId: listing._id, status: 'LIVE',
        currentHighestBid: 50, startTime: new Date(),
        endTime: new Date(Date.now() + 100_000),
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: bidder._id.toString() } } as any);

      const res = await createRegistrationOrder(auction._id.toString());

      expect(res.success).toBe(true);
      expect(res.isMock).toBe(false);
      // The vi.mock Razorpay returns 'order_live_test_123'
      expect(res.orderContext?.id).toBe('order_live_test_123');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // checkUserRegistrationStatus
  // ═══════════════════════════════════════════════════════════════════════
  describe('checkUserRegistrationStatus', () => {
    it('returns isRegistered: false when there is no session', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await checkUserRegistrationStatus(new mongoose.Types.ObjectId().toString());
      expect(res.isRegistered).toBe(false);
    });

    it('returns isRegistered: false when the user has NOT paid the deposit', async () => {
      const user = await User.create({
        username: 'u', email: 'u@t.com', role: 'USER',
        hasPaidVerificationDeposit: false,
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);
      const res = await checkUserRegistrationStatus(new mongoose.Types.ObjectId().toString());
      expect(res.isRegistered).toBe(false);
    });

    it('returns isRegistered: true when the user has paid the deposit', async () => {
      const user = await User.create({
        username: 'u', email: 'u@t.com', role: 'USER',
        hasPaidVerificationDeposit: true,
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);
      const res = await checkUserRegistrationStatus(new mongoose.Types.ObjectId().toString());
      expect(res.isRegistered).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // simulateMockPayment
  // ═══════════════════════════════════════════════════════════════════════
  describe('simulateMockPayment', () => {
    it('returns error when called in production', async () => {
      const orig = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      const res = await simulateMockPayment('order_mock_xyz');
      expect(res.success).toBe(false);
      expect(res.error).toContain('production');
      (process.env as any).NODE_ENV = orig;
    });

    it('returns Unauthorized when there is no session', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await simulateMockPayment('order_mock_xyz');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('returns error when RAZORPAY_KEY_ID is not a placeholder (live env)', async () => {
      process.env.RAZORPAY_KEY_ID = 'rzp_live_productionKey';
      const user = await User.create({ username: 'u', email: 'u@t.com', role: 'USER' });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);

      const res = await simulateMockPayment('order_mock_xyz');
      expect(res.success).toBe(false);
      expect(res.error).toContain('sandbox');
    });

    it('returns error when the orderId does not match any Registration document', async () => {
      const user = await User.create({ username: 'u', email: 'u@t.com', role: 'USER' });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);

      const res = await simulateMockPayment('order_mock_ghost');
      expect(res.success).toBe(false);
      expect(res.error).toContain('not found');
    });

    it('blocks cross-user order access (IDOR): attacker cannot confirm someone else\'s order', async () => {
      const owner = await User.create({ username: 'owner', email: 'o@t.com', role: 'USER' });
      const attacker = await User.create({ username: 'atk', email: 'a@t.com', role: 'USER' });
      await Registration.create({
        userId: owner._id,
        razorpayOrderId: 'order_mock_belongs_to_owner',
        status: 'PENDING',
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: attacker._id.toString() } } as any);

      const res = await simulateMockPayment('order_mock_belongs_to_owner');
      expect(res.success).toBe(false);
      expect(res.error).toContain('do not own');
    });

    it('happy path — marks the registration PAID and grants the wallet deposit bonus', async () => {
      const user = await User.create({
        username: 'u', email: 'u@t.com', role: 'USER', walletBalance: 0,
      });
      const reg = await Registration.create({
        userId: user._id,
        razorpayOrderId: 'order_mock_good',
        status: 'PENDING',
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);

      const res = await simulateMockPayment('order_mock_good');

      expect(res.success).toBe(true);

      const updatedReg = await Registration.findById(reg._id);
      expect(updatedReg?.status).toBe('PAID');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.hasPaidVerificationDeposit).toBe(true);
      expect(updatedUser?.walletBalance).toBe(2.5);
    });

    it('is idempotent — a second call on an already-PAID order returns success and does NOT reset the wallet', async () => {
      const user = await User.create({
        username: 'u', email: 'u@t.com', role: 'USER',
        hasPaidVerificationDeposit: true, walletBalance: 42,
      });
      await Registration.create({
        userId: user._id,
        razorpayOrderId: 'order_mock_already_paid',
        status: 'PAID',
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);

      const res = await simulateMockPayment('order_mock_already_paid');
      expect(res.success).toBe(true);

      // Wallet must stay at 42, not overwritten with 2.5
      const user2 = await User.findById(user._id);
      expect(user2?.walletBalance).toBe(42);
    });

    it('concurrency — two simultaneous simulate calls on the same PENDING order do not double-credit the wallet', async () => {
      const user = await User.create({
        username: 'u', email: 'u@t.com', role: 'USER', walletBalance: 0,
      });
      await Registration.create({
        userId: user._id,
        razorpayOrderId: 'order_mock_concurrent',
        status: 'PENDING',
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);

      // Fire both concurrently
      const [r1, r2] = await Promise.all([
        simulateMockPayment('order_mock_concurrent'),
        simulateMockPayment('order_mock_concurrent'),
      ]);

      // At least one must succeed
      expect(r1.success || r2.success).toBe(true);

      // The registration must be PAID exactly once
      const regs = await Registration.find({ razorpayOrderId: 'order_mock_concurrent' });
      expect(regs.length).toBe(1);
      expect(regs[0].status).toBe('PAID');

      // Wallet balance is 2.5 — NOT doubled to 5
      const finalUser = await User.findById(user._id);
      expect(finalUser?.walletBalance).toBe(2.5);
    });
  });
});

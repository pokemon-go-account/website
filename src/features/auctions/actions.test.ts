import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import {
  expireStaleAuctions,
  createListing,
  fetchAuctionRealtime,
  placeAuctionBid,
  uploadImageAction,
  fetchAllAuctionBids,
  createBuyNowOrderAction
} from './actions';
import Auction from '@/models/Auction';
import Listing from '@/models/Listing';
import Bid from '@/models/Bid';
import User from '@/models/User';
import Order from '@/models/Order';
import { auth } from '@/auth';

// ─── Shared minimal Listing fixture that satisfies the expanded schema ──────
const LISTING_FIXTURE = {
  title: 'Test Listing Account',
  description: 'This is a comprehensive test account description for the purposes of vitest.',
  telegramUsername: 'test_telegram',
  level: 40,
  xp: 12000000,
  stardust: 500000,
  team: 'MYSTIC' as const,
  shinyCount: 0,
  legendaryCount: 0,
  mythicalCount: 0,
  region: 'Global',
  screenshots: ['https://example.com/screenshot.jpg'],
  startingBid: 10,
  reservePrice: 30,
  minIncrement: 5,
  durationHours: 24,
  // Telemetry
  pokedexCompleted: 0,
  bestBuddyCount: 0,
  pokeCoins: 0,
  startDate: '2020-01-01',
  accountType: 'Regular',
  accountStatus: 'Good Standing',
  weeklyDistance: 0,
  topPokemon: '',
  // Resources
  rareCandy: 0,
  fastTm: 0,
  chargedTm: 0,
  eliteFastTm: 0,
  eliteChargedTm: 0,
  incubators: 0,
  luckyEggs: 0,
  lureModules: 0,
  premiumRaidPass: 0,
  // Pokemon stats
  platinumMedals: 0,
  legendaryPoses: 0,
  shinyPokemons: 0,
  shinyMythical: 0,
  shinyUltrabeasts: 0,
  shinyLegendaries: 0,
  legendaryPokemons: 0,
  ultrabeasts: 0,
  mythicalPokemons: 0,
  hundoMythicalLegendaryUltrabeast: 0,
  shundoLegendaryMythicalUltrabeast: 0,
  shundoPokemons: 0,
  hundoPokemons: 0,
  costumeShinies: 0,
  hatchedShinies: 0,
  luckyPokemons: 0,
  luckyLegendaries: 0,
  shinyLuckyLegendaries: 0,
  locationBackgroundLegendaryShiny: 0,
  specialBackgroundLegendaryShiny: 0,
  candyXlPokemons: 0,
  candyXlLegendaries: 0,
  bestBuddies: 0,
  dualMovePokemons: 0,
  shadowShinyPokemons: 0,
  pokemonStorage: 0,
  itemBagStorage: 0,
  masterBalls: 0,
  raidPasses: 0,
  superRocketRadar: 0,
  pokedexRegisteredNumber: 0,
  bansCount: 0,
};

beforeAll(async () => {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Auction.deleteMany({});
  await Listing.deleteMany({});
  await Bid.deleteMany({});
  await User.deleteMany({});
  await Order.deleteMany({});
  vi.clearAllMocks();
});

describe('Auctions Actions', () => {
  describe('expireStaleAuctions', () => {
    it('should transition expired LIVE/SCHEDULED auctions to COMPLETED and SCHEDULED to LIVE', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 10000);
      const future = new Date(now.getTime() + 10000);

      // Need two separate listings since Auction.listingId has a unique index
      const listingA = await Listing.create({
        ...LISTING_FIXTURE,
        sellerId: new mongoose.Types.ObjectId(),
        status: 'APPROVED',
      });

      const listingB = await Listing.create({
        ...LISTING_FIXTURE,
        sellerId: new mongoose.Types.ObjectId(),
        status: 'APPROVED',
      });

      const auctionExpired = await Auction.create({
        listingId: listingA._id,
        status: 'LIVE',
        currentHighestBid: 10,
        startTime: past,
        endTime: past
      });

      const auctionStarting = await Auction.create({
        listingId: listingB._id,
        status: 'SCHEDULED',
        currentHighestBid: 10,
        startTime: past,
        endTime: future
      });

      await expireStaleAuctions();

      const expired = await Auction.findById(auctionExpired._id);
      expect(expired?.status).toBe('COMPLETED');

      const started = await Auction.findById(auctionStarting._id);
      expect(started?.status).toBe('LIVE');
    });
  });

  describe('createListing', () => {
    it('should fail if user is not admin', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user1', role: 'USER' }, expires: '9999' } as any);
      
      const res = await createListing({});
      expect(res.success).toBe(false);
      expect(res.error).toBe('Unauthorized. Admin privileges required.');
    });

    it('should fail on validation errors', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'admin1', role: 'ADMIN' }, expires: '9999' } as any);
      
      const res = await createListing({});
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('should succeed with valid data', async () => {
      const adminId = new mongoose.Types.ObjectId().toString();
      vi.mocked(auth).mockResolvedValue({ user: { id: adminId, role: 'ADMIN' }, expires: '9999' } as any);
      
      const res = await createListing(LISTING_FIXTURE);
      expect(res.success).toBe(true);
      
      const listings = await Listing.find({});
      expect(listings.length).toBe(1);
      expect(listings[0].status).toBe('PENDING');
      expect(listings[0].title).toBe('Test Listing Account');
    });
  });

  describe('fetchAuctionRealtime', () => {
    it('should return error if auction not found', async () => {
      const res = await fetchAuctionRealtime(new mongoose.Types.ObjectId().toString());
      expect(res.success).toBe(false);
    });

    it('should fetch auction details and bids', async () => {
      const user = await User.create({ name: 'Bidder', username: 'bidder1', email: 'b@test.com', hasPaidVerificationDeposit: true });
      const listing = await Listing.create({
        ...LISTING_FIXTURE,
        status: 'APPROVED',
        sellerId: new mongoose.Types.ObjectId(),
      });
      const auction = await Auction.create({ listingId: listing._id, status: 'LIVE', currentHighestBid: 20, highestBidderId: user._id });
      
      await Bid.create({ auctionId: auction._id, bidderId: user._id, amount: 20 });

      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: '9999' } as any);

      const res = await fetchAuctionRealtime(auction._id.toString());
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.currentHighestBid).toBe(20);
        expect(res.highestBidderId).toBe(user._id.toString());
        expect(res.isRegistered).toBe(true);
        expect(res.bids!.length).toBe(1);
        expect(res.bids![0].amount).toBe(20);
      }
    });
  });

  describe('placeAuctionBid', () => {
    it('should fail if unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await placeAuctionBid(new mongoose.Types.ObjectId().toString(), 50);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('should place a valid bid', async () => {
      const user = await User.create({ name: 'Bidder', username: 'bidder1', email: 'b@test.com', hasPaidVerificationDeposit: true });
      const seller = await User.create({ name: 'Seller', username: 'seller1', email: 's@test.com' });
      const listing = await Listing.create({
        ...LISTING_FIXTURE,
        status: 'APPROVED',
        sellerId: seller._id,
      });
      const auction = await Auction.create({ listingId: listing._id, status: 'LIVE', currentHighestBid: 10, startTime: new Date(), endTime: new Date(Date.now() + 100000) });
      
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: '9999' } as any);

      const res = await placeAuctionBid(auction._id.toString(), 20);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.currentHighestBid).toBe(20);
        expect(res.highestBidderId).toBe(user._id.toString());
      }
    });

    it('should fail if user is suspended', async () => {
      const user = await User.create({ name: 'Bidder', username: 'bidder1', email: 'b@test.com', hasPaidVerificationDeposit: true, isSuspended: true });
      const auctionId = new mongoose.Types.ObjectId().toString();
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: '9999' } as any);
      
      const res = await placeAuctionBid(auctionId, 20);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Your account is suspended.');
    });

    it('should fail if deposit not paid', async () => {
      const user = await User.create({ name: 'Bidder', username: 'bidder1', email: 'b@test.com', hasPaidVerificationDeposit: false });
      const auctionId = new mongoose.Types.ObjectId().toString();
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: '9999' } as any);
      
      const res = await placeAuctionBid(auctionId, 20);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Verification deposit');
    });
  });

  describe('uploadImageAction', () => {
    it('should fail if unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await uploadImageAction('data:image/png;base64,12345');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Unauthorized.');
    });

    it('should fail if invalid mime type', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' }, expires: '9999' } as any);
      const res = await uploadImageAction('data:text/plain;base64,12345');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Invalid file type');
    });
  });

  describe('createBuyNowOrderAction', () => {
    it('should fail if unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await createBuyNowOrderAction(new mongoose.Types.ObjectId().toString());
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('should create order', async () => {
      const user = await User.create({ name: 'Buyer', username: 'buyer1', email: 'buyer@test.com' });
      const listing = await Listing.create({
        ...LISTING_FIXTURE,
        status: 'APPROVED',
        sellerId: new mongoose.Types.ObjectId(),
      });
      const auction = await Auction.create({ listingId: listing._id, status: 'LIVE', currentHighestBid: 10 });
      
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: '9999' } as any);

      const res = await createBuyNowOrderAction(auction._id.toString());
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.orderId).toBeDefined();
      }
      
      const order = await Order.findOne({ userId: user._id });
      expect(order).toBeDefined();
      expect(order?.totalPrice).toBe(40);
    });
    
    it('should not create order if highest bid >= 80% of Buy Now price', async () => {
      const user = await User.create({ name: 'Buyer', username: 'buyer1', email: 'buyer@test.com' });
      const listing = await Listing.create({
        ...LISTING_FIXTURE,
        status: 'APPROVED',
        sellerId: new mongoose.Types.ObjectId(),
      });
      // Buy Now price = startingBid * 4 = 40. 80% of 40 = 32.
      const auction = await Auction.create({ listingId: listing._id, status: 'LIVE', currentHighestBid: 32 });
      
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: '9999' } as any);

      const res = await createBuyNowOrderAction(auction._id.toString());
      expect(res.success).toBe(false);
      expect(res.error).toContain('Buy Now is disabled');
    });

    it('should keep the auction LIVE when creating a pending Buy Now order, and complete it only when the order is marked as completed', async () => {
      const user = await User.create({ name: 'Buyer', username: 'buyer1', email: 'buyer@test.com' });
      const listing = await Listing.create({
        ...LISTING_FIXTURE,
        status: 'APPROVED',
        sellerId: new mongoose.Types.ObjectId(),
      });
      const auction = await Auction.create({ listingId: listing._id, status: 'LIVE', currentHighestBid: 10 });
      
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() }, expires: '9999' } as any);

      // 1. Create Buy Now order
      const res = await createBuyNowOrderAction(auction._id.toString());
      expect(res.success).toBe(true);
      
      // The auction status must remain LIVE
      const updatedAuction1 = await Auction.findById(auction._id);
      expect(updatedAuction1?.status).toBe('LIVE');

      // 2. Complete order using completeOrderConsole
      const { completeOrderConsole } = await import('@/features/console/actions');
      
      // Mock session for checkSuperAdminSession
      vi.mocked(auth).mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString(), role: 'SUPER_ADMIN' }, expires: '9999' } as any);

      const completeRes = await completeOrderConsole(res.orderId!);
      expect(completeRes.success).toBe(true);

      // The auction status must now be COMPLETED
      const updatedAuction2 = await Auction.findById(auction._id);
      expect(updatedAuction2?.status).toBe('COMPLETED');
      expect(updatedAuction2?.buyNowBuyerId?.toString()).toBe(user._id.toString());
    });
  });
});

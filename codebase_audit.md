# 🔍 Comprehensive Codebase Audit — pokemon-go-auction-website (Updated)

This is a revised audit reflecting the **current** state of the codebase. Great job on fixing the critical security vulnerabilities (email verification, mock payments, regex DoS) and major logic bugs (webhook amounts, PENDING overwrites, bid increments, and scheduled bidding). 

The issues below represent the remaining architectural, logic, and UX bugs that still need attention.

---

## 🟠 HIGH — Logic Bugs & Data Integrity

### L-01: No automatic auction expiration enforcement
**Files:** Entire codebase
The system currently has no server-side cron job, background task, or scheduled worker to automatically transition auctions from `LIVE` to `COMPLETED` when `endTime` passes. 
- The `/auctions` catalog does client-side date filtering, but the DB is stale.
- Any server code that queries by `status: "COMPLETED"` will miss naturally expired auctions.
**Fix required:** Implement a cron job (via Vercel Cron, node-cron, or an external trigger) to regularly sweep and update expired auctions, resolving their state.

### L-02: `currentHighestBid` initializes at `startingBid`
**File:** `src/features/admin/actions.ts` (Line 127)
When an auction is created, `currentHighestBid` is immediately set to the listing's `startingBid`. This creates ambiguity in the UI—it is difficult to distinguish between "an auction with 0 bids that starts at $100" and "an auction with 1 bid of $100" without directly checking if `highestBidderId` is null. 
**Fix required:** Treat `currentHighestBid` as `0` or explicitly handle the 0-bid state in all UI components instead of conflating the starting price with the current bid.

### L-03: Hardcoded registration fee mismatch
**File:** `src/features/admin/actions.ts` (Line 131)
The admin approval action hardcodes `registrationFee: 199` when creating the Auction record. However, the Razorpay payment intent system actively charges `250` cents ($2.50 USD). This mismatch will cause accounting discrepancies and confusion.
**Fix required:** Unify the fee constants across the platform to a single source of truth (e.g., a `PAYMENT_CONSTANTS` config file).

---

## 🟡 MEDIUM — Architectural & Maintenance Issues

### A-01: Massive 2,297-line `live-room.tsx` component
**File:** `src/features/auctions/components/live-room.tsx`
This single file is extremely bloated, handling WebSockets, multiple modals, admin controls, bid history, payment flows, gallery viewers, and social redirects. It is a massive maintenance liability.
**Fix required:** Refactor this into smaller, focused components (`BidHistory`, `BiddingControls`, `AuctionGallery`, `LiveRoomModals`).

### A-02: Fake WebSockets (Socket Polling)
**File:** `src/hooks/use-socket.ts`
While the polling interval was increased from 1.5s to 5s to mitigate server load, the "socket" implementation is still just HTTP long-polling the database via the `fetchAuctionRealtime` server action. 
**Fix required:** Implement true WebSocket connections using `socket.io` or a managed service like Pusher/Ably to push updates to clients only when data changes.

### A-03: Session is not invalidated upon suspension
**File:** `src/features/admin/actions.ts`
When an admin triggers a cascade or manually suspends a user (`isSuspended: true`), the user's existing JWT session remains valid. They can continue navigating authenticated routes until their token naturally expires.
**Fix required:** Implement a middleware check or session callback that verifies `isSuspended` on every request, or store an invalidated tokens list.

### A-04: Extensive use of `as any` type casts
**Files:** Multiple (e.g., `src/auth.config.ts`, `src/features/admin/actions.ts`)
The codebase bypasses TypeScript's type safety extensively. For example, `(session.user as any).adminRentPaidUntil`. NextAuth session properties should be properly typed.
**Fix required:** Create a `next-auth.d.ts` file to augment the NextAuth Session and User types.

---

## 🔵 LOW — UX, Performance & Polish Issues

### U-01: No loading states for the auctions catalog
**File:** `src/app/auctions/page.tsx`
The catalog is a Server Component that blocks rendering while querying MongoDB. There is no `loading.tsx` file to show a skeleton state, meaning users experience a blank hang on navigation.
**Fix required:** Add a `loading.tsx` file with skeleton loaders to the `/auctions` route.

### U-02: Currency conversion fetches live rates without caching
**File:** `src/store/useCurrencyStore.ts`
Every time a user switches currencies, a fresh API call is made to `open.er-api.com` without caching or debouncing.
**Fix required:** Cache exchange rates in localStorage or server-side (e.g., Redis) with a 24-hour TTL.

### U-03: Contact form lacks bot protection
**File:** `src/app/contact/page.tsx`
The contact form can be submitted without any CAPTCHA or rate limiting, making it highly vulnerable to bot spam.
**Fix required:** Implement Google reCAPTCHA v3 or Cloudflare Turnstile on the contact form, similar to the auth flow.

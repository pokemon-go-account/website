# 🔍 Comprehensive Codebase Audit — pokemon-go-auction-website

Every file has been read and analyzed. Issues are grouped by severity and category.

---

## 🔴 CRITICAL — Security Vulnerabilities

### S-01: Email verification is completely bypassable
**Files:** [verify-email-actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/auth/verify-email-actions.ts), [email-verification-banner.tsx](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/app/(dashboard)/profile/email-verification-banner.tsx)

The `syncEmailVerification()` server action blindly sets `isEmailVerified: true` in MongoDB without **any server-side verification** that the user actually clicked the email link. It trusts the client's word. Any authenticated user can call this action directly and become "verified" instantly.

**Fix required:** The server action must independently verify the user's email status by calling `firebase-admin`'s `getAuth().getUser(uid)` and checking `emailVerified` on the server side. Never trust the client.

---

### S-02: Google/OAuth users never get marked as email-verified
**Files:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/auth/actions.ts#L192-L239)

When a user registers via Google (`loginWithFirebaseIdToken`), their email is already verified by Google. But the code never sets `isEmailVerified: true` on the MongoDB User document. These users see the "Email Not Verified" banner forever.

**Fix required:** In `loginWithFirebaseIdToken`, after creating or finding a user via a Google/social provider, check if `decoded.email` exists (Google always provides verified emails) and set `isEmailVerified: true`.

---

### S-03: Firebase Admin sandbox fallback bypasses token verification in production
**File:** [firebase-admin.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/lib/firebase-admin.ts#L82-L100)

If `FIREBASE_SERVICE_ACCOUNT` is not configured (or misconfigured), the code **silently falls back to decoding the JWT without signature verification**. An attacker could craft any JWT payload and impersonate any user. This must throw an error in production, not silently degrade.

**Fix required:** Check `NODE_ENV` — in production, never allow the sandbox fallback. Only allow it in development.

---

### S-04: `simulateMockPayment` server action is still callable in production
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/payments/actions.ts#L165-L190)

The `simulateMockPayment()` server action allows any authenticated user to mark any registration as "PAID" without paying. It doesn't check if the Razorpay keys are placeholders — it's always available. An attacker can call it directly to bypass the $2.50 deposit.

**Fix required:** Either delete this function entirely for production, or gate it behind `process.env.NODE_ENV !== "production"` and verify the caller's registration ownership.

---

### S-05: `handleDevSandboxPayment` mock flow still in production code
**File:** [register-button.tsx](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/payments/components/register-button.tsx#L20-L56)

The entire `handleDevSandboxPayment` function with `confirm()` dialogs and mock payment simulation is still defined in the production component. While the UI button that triggers it may have been removed, the function and its import of `simulateMockPayment` remain.

---

### S-06: No rate limiting on contact form, bid placement, or registration
**Files:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/contact/actions.ts), [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/auctions/actions.ts)

- Contact form has no rate limiting — a bot can spam thousands of messages.
- Bid placement has no rate limiting — a user can flood `placeAuctionBid` with rapid requests.
- reCAPTCHA is only on login/register, not on contact, bidding, or recovery forms.

---

### S-07: RegEx injection vulnerability in admin user lookup
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts#L586)

```js
User.findOne({ username: { $regex: new RegExp(`^${username.trim()}$`, "i") } })
```

The `username` input is directly interpolated into a `RegExp` constructor without escaping special characters. A malicious admin could craft a regex DoS (ReDoS) attack.

**Fix required:** Escape the username string before constructing the regex, or use a simple case-insensitive exact match with `collation`.

---

### S-08: `uploadImageAction` has no file size or type validation
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/auctions/actions.ts#L195-L209)

Any authenticated user can upload any base64 string to Cloudinary with no size limit, no file type check, and no content validation. This could be used to upload malicious files, extremely large payloads (DoS), or inappropriate content.

---

### S-09: Admin rent check is only in middleware, not in server actions
**File:** [auth.config.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/auth.config.ts#L94-L111)

Admin rent validity is checked in the middleware `authorized` callback (page-level access), but `checkAdminSession()` in server actions does not verify rent status. An ADMIN with expired rent can still call all admin server actions directly.

---

## 🟠 HIGH — Logic Bugs & Data Integrity

### L-01: Bid can be placed on a SCHEDULED auction, changing it to LIVE prematurely
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/auctions/actions.ts#L144-L165)

```js
if (auction.status !== "LIVE" && auction.status !== "SCHEDULED") {
  return { success: false, error: "Auction is not accepting bids." };
}
```

And the atomic update includes:
```js
status: { $in: ["LIVE", "SCHEDULED"] }
// ...
$set: { status: "LIVE" }
```

A SCHEDULED auction can receive bids and be flipped to LIVE status. This bypasses any intended scheduling mechanism.

---

### L-02: `forceEndAuction` shows "no bids" even when bids exist
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts#L220-L239)

When `forceEndAuction` is called, it sets `status: "COMPLETED"` and `endTime: now()`, but it does NOT check/preserve the `highestBidderId`. The UI then treats it as "expired with no bids" if the highest bidder display logic relies on `currentHighestBid === startingBid`.

---

### L-03: No automatic auction expiration enforcement
**Files:** All auction-related files

The system has no cron job, no background task, and no server-side scheduler to automatically transition auctions from LIVE to COMPLETED when `endTime` passes. It relies entirely on the client-side UI to show "concluded" based on date comparison. The database `status` field stays "LIVE" forever until an admin manually ends it.

This means:
- The `/auctions` catalog does client-side date filtering but the DB is stale
- `placeAuctionBid` checks `new Date() >= new Date(auction.endTime)` on every bid, but the status field is never updated
- Any code that queries by `status: "COMPLETED"` will miss naturally expired auctions

---

### L-04: `currentHighestBid` starts at `startingBid` value, creating confusion
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts#L117)

When an auction is created, `currentHighestBid` is set to `listing.startingBid`. This means a brand new auction with zero bids appears to already have a bid. The UI cannot distinguish between "starting price" and "actual bid placed" without querying the Bid collection.

---

### L-05: Bid validation uses `$lte` instead of `$lt` — allows bidding exactly at minimum
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/auctions/actions.ts#L154)

```js
currentHighestBid: { $lte: bidAmount - minIncrement }
```

This is correct for requiring `bidAmount >= currentHighestBid + minIncrement`. However, the first bid scenario creates an issue: if `currentHighestBid` equals `startingBid` (e.g., $100) and `minIncrement` is $10, the first bidder must bid at least $110, not $100. The starting bid is never actually achievable.

---

### L-06: Race condition between bid placement and auction check
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/auctions/actions.ts#L140-L166)

The time check `new Date() >= new Date(auction.endTime)` is done before the atomic `findOneAndUpdate`, but the auction could expire between the check and the update. The atomic update does not include an `endTime: { $gt: new Date() }` condition.

---

### L-07: `triggerForfeitCascade` suspends user without any appeal or notification mechanism
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts#L465-L510)

The forfeit cascade immediately suspends the winning bidder (`isSuspended: true`) with no notification, no email, and no appeal mechanism. A falsely triggered cascade permanently locks a user out.

---

### L-08: Registration upsert can overwrite a PAID registration to PENDING
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/payments/actions.ts#L102-L111)

```js
await Registration.findOneAndUpdate(
  { userId: user._id, auctionId: auction._id },
  { $set: { razorpayOrderId: orderId, status: "PENDING" } },
  { upsert: true }
);
```

If a user has already paid (status: "PAID") and then clicks the register button again (the earlier check only prevents if there IS a PAID registration), the check at line 49 should catch this. But if there's any timing issue or if the check passes but the upsert runs, it could overwrite PAID back to PENDING, revoking their bidding access.

---

### L-09: Webhook handler doesn't verify `razorpayOrderId` belongs to the event's order
**File:** [route.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/app/api/webhooks/razorpay/route.ts)

The webhook handler looks up a registration by `razorpayOrderId` and marks it PAID. But it doesn't verify the payment amount matches the expected $2.50. A webhook replay with a different amount or a partially captured payment could mark a registration as paid.

---

### L-10: Polling interval of 1.5 seconds creates excessive server load
**File:** [use-socket.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/hooks/use-socket.ts#L61)

Every client viewing an auction detail page polls `fetchAuctionRealtime` every 1.5 seconds. This makes a full MongoDB query with two `.populate()` calls each time. With 100 concurrent viewers, that's ~67 DB queries per second for a single auction. This will not scale.

---

## 🟡 MEDIUM — Code Quality & Architectural Issues

### A-01: Massive 2200+ line `live-room.tsx` component — unmaintainable
**File:** [live-room.tsx](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/auctions/components/live-room.tsx)

This single file is over 2200 lines with multiple modals, admin controls, bid history, payment flows, gallery viewers, and social redirect handlers all in one component. It's extremely fragile and nearly impossible to modify without introducing tag-nesting bugs (as already happened multiple times).

---

### A-02: Extensive use of `as any` type casts throughout the codebase
**Files:** Multiple — [auth.config.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/auth.config.ts), [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/auctions/actions.ts), [page.tsx](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/app/auctions/%5Bid%5D/page.tsx)

At least 30+ instances of `as any` casts that bypass TypeScript's type safety. Key examples:
- Session user properties cast to `any` for custom fields like `isOnboarded`, `adminRentPaidUntil`
- All populated Mongoose documents accessed via `(auctionDoc.listingId as any).title`
- Server action return types are untyped `{ success: false, error: any }`

---

### A-03: No proper Next.js type augmentation for session
**Files:** [auth.config.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/auth.config.ts), [auth.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/auth.ts)

Custom session properties (`role`, `id`, `isOnboarded`, `adminRentPaidUntil`) are not declared in a `next-auth.d.ts` types file, forcing `as any` casts everywhere.

---

### A-04: Firebase client SDK initialized at module level outside components
**File:** [firebase.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/lib/firebase.ts#L34-L36)

```js
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
const appleProvider = new OAuthProvider("apple.com");
```

These are initialized at module scope **outside** the `typeof window !== "undefined"` guard. On the server, `GoogleAuthProvider` and `OAuthProvider` will be instantiated during SSR, which could cause issues with server-side rendering.

---

### A-05: No Google provider in NextAuth — only Credentials
**File:** [auth.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/auth.ts)

There is no Google OAuth provider configured in NextAuth. Google login works through a convoluted Firebase→ID Token→Credentials bypass flow. This means session management, token refresh, and sign-out are all fragmented between Firebase client SDK and NextAuth.

---

### A-06: `revalidatePath` calls target stale paths
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts)

Multiple calls to `revalidatePath("/admin")` but this route doesn't exist in the app directory. The admin dashboard is at `/dashboard/admin` and `/console`. These are no-ops.

---

### A-07: No error boundary or 404/error pages for auction routes
**Files:** App directory

There are no `error.tsx` or `not-found.tsx` components in the `/auctions` or `/store` route segments. If a Mongoose query fails or an auction ID is malformed, the user gets a generic Next.js error page.

---

### A-08: Cookie/session not invalidated on user suspension
**Files:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts)

When a user is suspended via `isSuspended: true`, their existing JWT session remains valid. They can continue using the app until their token expires. The suspension check happens only on login and bid placement, not universally.

---

### A-09: `connectDB()` called inconsistently — some actions call it twice
**Files:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts)

`checkAuctionControlSession` queries Auction and Listing models but doesn't call `connectDB()` — it relies on the caller to have already connected. If the order of operations changes, queries will fail. Other actions call `connectDB()` after the session check, but the session check itself may need a DB connection.

---

### A-10: Currency store `convert()` uses `Math.round()` — loses cents precision
**File:** [useCurrencyStore.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/store/useCurrencyStore.ts#L87)

```js
formatted: `${symbol}${Math.round(convertedAmount).toLocaleString()}`
```

This rounds to the nearest integer. A $0.99 product in USD would display as "$1" and a $2.50 deposit would show as "$3" or "$2" depending on rounding. For JPY this is fine, but for USD/EUR/GBP, decimals matter.

---

## 🔵 LOW — UX, Performance & Polish Issues

### U-01: No password reset / forgot password flow
**Files:** Login flow

There is no "Forgot Password?" link, no password reset email mechanism, and no way for users to recover their credential-based accounts if they forget their password.

---

### U-02: Username is auto-generated and never changeable
**Files:** [username.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/utils/username.ts), profile pages

Users get randomly assigned usernames like "Swift-Pikachu-4321" and there's no UI to change them. Since usernames are displayed publicly in bid history, users might want control over their identity.

---

### U-03: No pagination on auctions catalog or admin console
**Files:** [page.tsx](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/app/auctions/page.tsx), admin pages

All auctions, products, users, recovery requests, contact messages, and webhook logs are loaded in a single query with no pagination. As the dataset grows, pages will become extremely slow.

---

### U-04: Contact form has no reCAPTCHA protection
**File:** [page.tsx](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/app/contact/page.tsx)

The contact form can be submitted without any CAPTCHA or rate limiting. Bots can spam the contact inbox.

---

### U-05: Image uploads have no compression or dimension limits
**Files:** [cloudinary.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/lib/cloudinary.ts), upload actions

Screenshots are uploaded as raw base64 with no client-side compression, no server-side resizing, and no dimension/filesize enforcement. Users could upload 10MB+ images.

---

### U-06: `endTime` crash if auction has no endTime set
**File:** [page.tsx](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/app/auctions/%5Bid%5D/page.tsx#L93)

```js
endTime: (auctionDoc.endTime as Date).toISOString(),
```

If `endTime` is `null` or `undefined`, this will throw. The Auction model allows `endTime` to be optional (`endTime?: Date`).

---

### U-07: No SEO meta tags on dynamic pages
**Files:** Auction detail, store, contact, recovery pages

Dynamic pages like `/auctions/[id]` have no `<title>`, `<meta description>`, or Open Graph tags. Search engines will index them with generic Next.js defaults.

---

### U-08: Feedback system has no moderation
**File:** [Feedback.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/models/Feedback.ts)

There's no admin console section for moderating feedback. Feedback appears to go directly public without any review mechanism.

---

### U-09: Recovery request screenshot upload happens sequentially before form validation
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/recovery/actions.ts#L74-L79)

The Cloudinary upload happens after validation but the full upload could take significant time. If the upload fails after 2 of 3 images, the user gets an error with no partial recovery.

---

### U-10: Store cart state is lost on page refresh (client-side only)
**File:** [storefront-client.tsx](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/store/components/storefront-client.tsx)

The cart is managed with React `useState` and has no persistence (localStorage, cookies, or server-side). Refreshing the page empties the cart.

---

### U-11: Privacy and Terms pages are static and may have placeholder content
**Files:** `/privacy/page.tsx`, `/terms/page.tsx`

These legal pages need to be verified for accuracy before production launch.

---

### U-12: `topPokemon` field stored as comma-separated string
**File:** [Listing.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/models/Listing.ts#L85)

The `topPokemon` field is a raw string like "Mewtwo(3950), Kyogre(3800)". This makes it impossible to query, filter, or validate individual Pokemon entries. It should be a structured array.

---

### U-13: Webhook logs store full raw payload as string (unbounded)
**File:** [WebhookLog.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/models/WebhookLog.ts)

The `payload` field stores the entire raw webhook body as a string. Razorpay webhooks can be large. There's no size limit, no TTL/cleanup, and no archival strategy.

---

### U-14: No email notifications for any event
**Files:** Entire codebase

There are no email notifications for:
- New bids on your auction
- Auction won/lost
- Account suspension
- Recovery request status changes
- Registration payment confirmation
- Password changed

The `nodemailer` package is in dependencies but appears unused.

---

### U-15: `Listing.startDate` and `Listing.accountType` are required but have no defaults
**File:** [Listing.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/models/Listing.ts#L81-L83)

These fields are `required: true` in Mongoose but older listings created before these fields were added will fail to load or save if they're missing, potentially breaking queries.

---

### U-16: `escrowStage` can be set to any string via `updateEscrowStage`
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts#L399)

```js
export async function updateEscrowStage(listingId: string, stage: any) {
```

The `stage` parameter is typed as `any` and never validated against the enum. An admin could set it to any arbitrary string.

---

### U-17: Hardcoded registration fee of 199 (not 250 / $2.50)
**Files:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts#L121), [Auction.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/models/Auction.ts#L25)

The auction model defaults `registrationFee` to `199`, and the approve listing action hardcodes it to `199`. But the payment system charges `250` cents ($2.50 USD). The displayed fee and the charged amount are inconsistent.

---

### U-18: No CSRF protection on server actions beyond NextAuth session
**Files:** All server actions

Next.js server actions in App Router have built-in CSRF protection via the `__next_action_id` header, but custom API routes like the Razorpay webhook only check the Razorpay signature. Other custom endpoints could be vulnerable.

---

### U-19: `resumeAuction` doesn't extend the endTime
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts#L197-L215)

When an auction is paused and then resumed, the `endTime` is not adjusted. If an auction was paused for 3 hours, those 3 hours are lost. The auction could expire immediately upon resumption.

---

### U-20: `deleteAuction` doesn't clean up Cloudinary images
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts#L244-L271)

When an auction is deleted, associated listing screenshots on Cloudinary are never cleaned up. Over time, this leads to orphaned assets and unnecessary storage costs.

---

### U-21: Auction catalog search uses unescaped regex patterns
**File:** [page.tsx](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/app/auctions/page.tsx#L29-L33)

```js
{ title: { $regex: search.trim(), $options: "i" } }
```

User-supplied search terms are passed directly to MongoDB `$regex` without escaping. Special regex characters (`.`, `*`, `+`, `(`, etc.) in search queries will cause unexpected behavior or errors.

---

### U-22: `updateAuction` accepts unvalidated `fields: any`
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.ts#L318)

The `updateAuction` function accepts `fields: any` with no schema validation. While it only applies whitelisted field names, the values themselves are never validated (e.g., negative levels, impossible dates, SQL injection in string fields).

---

### U-23: Currency conversion fetches live rates on every currency change, no caching
**File:** [useCurrencyStore.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/store/useCurrencyStore.ts#L40)

Every time a user switches currency, a fresh API call is made to `open.er-api.com`. There's no caching, no debouncing, and no TTL. If the API is down, users see randomized fallback rates that change on every toggle.

---

### U-24: `Apple Sign-In` provider is imported but never connected
**File:** [firebase.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/lib/firebase.ts#L36)

The `appleProvider` is created but there's no Apple Sign-In button in the login form. Dead code.

---

### U-25: Recovery request `hasEmailAccess` validation is misleading
**File:** [actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/recovery/actions.ts#L17-L19)

```js
hasEmailAccess: z.boolean().refine((val) => val === true, {
  message: "You must confirm access to the email",
}),
```

This forces the user to say "yes" they have email access. If they don't have access (which is the whole point of recovery), they can't submit the form.

---

### U-26: No input sanitization for HTML/XSS in user-submitted content
**Files:** All form submissions — contact, feedback, listing descriptions, admin notes

User-submitted text (listing titles, descriptions, admin notes, contact messages, feedback comments) is stored raw in MongoDB and rendered without sanitization. If any of these are rendered with `dangerouslySetInnerHTML` or similar, XSS attacks are possible.

---

### U-27: `Admin Rent` system has no automated billing cycle
**Files:** [AdminRent.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/models/AdminRent.ts)

The AdminRent model exists but there's no automated creation of weekly rent records, no payment integration for admins, and no notification when rent is due. The `adminRentPaidUntil` field on User seems to be manually managed by SUPER_ADMIN.

---

### U-28: Missing `alt` attributes and accessibility concerns
**Files:** Multiple UI components

Image elements in the auction catalog and store use generic or missing `alt` text. The site has no ARIA labels on custom buttons, modals lack focus trapping, and the color contrast of some small text may fail WCAG standards.

---

### U-29: `Listing.validation.ts` allows `pokedexCompleted` range 0-100 but model has no max
**Files:** [Listing.validation.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/models/Listing.validation.ts#L34), [Listing.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/models/Listing.ts#L78)

Zod validates `pokedexCompleted` between 0-100, but the Mongoose schema has no `max` constraint. Data inserted directly via MongoDB shell or admin edit bypasses Zod validation.

---

### U-30: No loading states for the auctions catalog page
**File:** [page.tsx](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/app/auctions/page.tsx)

The auctions catalog is a Server Component with `revalidate = 0`, meaning it blocks on every page load while querying MongoDB. There's no `loading.tsx` file to show a skeleton while data loads.

---

## 📊 Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical (Security) | 9 |
| 🟠 High (Logic/Data) | 10 |
| 🟡 Medium (Architecture) | 10 |
| 🔵 Low (UX/Performance) | 21 |
| **Total** | **50** |

> [!IMPORTANT]
> Issues **S-01 through S-04** should be fixed before production launch. They represent real, exploitable vulnerabilities.

> [!WARNING]
> Issue **L-03** (no automatic auction expiration) means your auction system fundamentally doesn't self-manage. Every auction will stay "LIVE" in the database forever unless manually ended.

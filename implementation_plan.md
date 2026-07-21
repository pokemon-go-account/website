# Backend Unit Testing Plan — Pokémon GO Auction Platform

This plan addresses the implementation of comprehensive backend unit and regression tests utilizing Vitest. We will cover server actions, console actions, news, feedback, payment integrations, and API routes that currently have zero or low test coverage.

## User Review Required

> [!WARNING]
> **Discovered Security Gap**:
> During code review, it was identified that `verifyPayment` and `rejectPayment` in [payment-actions.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/console/payment-actions.ts) **do not have any session validation or admin role checks** (unlike other admin/console files which verify session with `checkAdminSession` or `checkSuperAdminSession`).
> 
> As this plan focuses strictly on writing regression tests and not refactoring core business logic (to avoid breaking current live behaviors), the tests will verify the *current* execution path. However, we highly recommend adding authorization checks to these functions immediately after this test suite is in place.

---

## Proposed Changes

We will introduce unit tests for the following components, using standard Vitest mock structures for Mongoose database objects, external APIs (Razorpay/Cloudinary/nodemailer/resend), and NextAuth sessions.

### 1. Admin Actions Test Suite
Introduce tests covering admin-only operations such as listing approvals, auction life cycle adjustments (pause/resume/force-end), bid rollback, escrow stage management, product/category catalog management, and request status changes.

#### [NEW] [actions.test.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/admin/actions.test.ts)
* Test all admin privilege gates (verifying unauthorized user roles fail).
* Test successful operations: `approveListing`, `rejectListing`, `pauseAuction`, `resumeAuction`, `forceEndAuction`, `reactivateAuction`, `rollbackAuctionBid`, `updateEscrowStage`, `saveListingCredentials`, and `releaseEscrowFunds`.
* Test category and product CRUD operations (`createCategory`, `updateCategory`, `deleteCategory`, `createProduct`, `updateProduct`, `deleteProduct`).
* Test request managers (`updatePokemonRequestStatus`, `updateCustomRequestStatus`).
* Mock `cloudinary` image uploads and `nodemailer`/`resend` triggers where applicable.

---

### 2. Console Actions Test Suite
Add test coverage for general console operations, user management, registration approvals, and order processing.

#### [NEW] [actions.test.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/console/actions.test.ts)
* Test role promotion/demotion (`promoteToAdmin`, `demoteToUser`) and suspension rules (`toggleUserSuspension`).
* Test manually marking rent paid (`markRentPaid`) and the associated registration logic.
* Test bidder registration approvals (`verifyRegistrationConsole`, `failRegistrationConsole`).
* Test manual registration updates (`createRegistrationManuallyConsole`).
* Test order processing status shifts (`completeOrderConsole`, `failOrderConsole`, `cancelOrderUser`).

---

### 3. Payments and Custom Payment Integrations Test Suite
Add tests for standard and custom integration workflows (PayPal, Wise, Crypto).

#### [NEW] [actions.test.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/payments/actions.test.ts)
* Test `createRegistrationOrder` (including Razorpay order generation logic with placeholders and mocked SDK responses).
* Test mock payment simulation (`simulateMockPayment`).
* Test `checkUserRegistrationStatus` logic.

#### [NEW] [payment-actions.test.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/console/payment-actions.test.ts)
* Test `verifyPayment` and `rejectPayment` executions.
* Validate current behavior (which runs without session checking) and verify it correctly updates the corresponding payments model and associated registration/order structures.

---

### 4. News, Feedback, and Recovery Actions Test Suites
Add tests for news article management, feedback reviews, and account recovery submissions.

#### [NEW] [actions.test.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/news/actions.test.ts)
* Test article CRUD operations (`createArticle`, `updateArticle`, `deleteArticle`), slug slugification, and view tracking.

#### [NEW] [actions.test.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/feedback/actions.test.ts)
* Test user feedback submission, validation rules, ratings limits, and console review updates.

#### [NEW] [actions.test.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/recovery/actions.test.ts)
* Test `createRecoveryRequest` (verifying lightweight client-direct URL insertions).
* Test admin operations: `updateRecoveryRequestStatus`, `updateRecoveryRequestPrice`, and `markRecoveryPaid`.

---

### 5. Analytics Actions Test Suite
Validate the paginated and aggregated revenue calculations.

#### [NEW] [revenue-actions.test.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/src/features/analytics/revenue-actions.test.ts)
* Test `getRevenueAnalyticsAction` database aggregates (`$group` logic).
* Verify exact revenue totals (storefront vs recovery vs auction vs buy-now).
* Test page pagination/limit structures and chronological order sorting.

---

### 6. API Route Handlers Test Suite
Verify endpoint inputs, routing, and header processing by constructing mock `NextRequest` and `Request` instances.

#### [NEW] [api-routes.test.ts](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/tests/api-routes.test.ts)
* Test Razorpay Webhook POST route (signature validation via HMAC).
* Test payment submissions (submit, submit-crypto, submit-wise, submit-paypal).
* Test cron endpoint (`/api/cron/expire-auctions` GET trigger).
* Test analytics endpoints (`stats` GET request, `ping` POST request).

---

## Verification Plan

### Automated Tests
* We will verify the test files compile correctly without any TypeScript issues:
  `npx tsc --noEmit`
* Since you requested to run the tests yourself and paste the output, we will not run Vitest commands on our side. We will provide the test code ready for your execution.

### Manual Verification
* Review the newly added test specs for mock assertions, clean database teardown after runs, and schema coverage.

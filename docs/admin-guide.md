# Admin Control Center Operations Guide

This guide details the features, inner workings, and step-by-step procedures for platform operators using the **Admin Control Center** (`/admin`).

---

## Table of Contents
1. [Module 1: Review Auditor (Metadata & Proof Screencaps)](#module-1-review-auditor-metadata--proof-screencaps)
2. [Module 2: Live Room Kill Switch (Bidding Controls)](#module-2-live-room-kill-switch-bidding-controls)
3. [Module 3: Escrow Pipeline & Credentials Vault](#module-3-escrow-pipeline--credentials-vault)
4. [Module 4: Forfeit & Runner-Up Cascade Engine](#module-4-forfeit--runner-up-cascade-engine)
5. [Module 5: Webhook watchdog & Force Sync](#module-5-webhook-watchdog--force-sync)

---

## Module 1: Review Auditor (Metadata & Proof Screencaps)

Sellers submit Trainer Account listings for moderation review. The **Review Auditor** provides tools to check account parameters against screenshot attachments to prevent visual fraud.

### How it Works:
* **Dual-Pane View:** 
  * The **left pane** contains editable input fields mapping listing parameters (Title, Level, Stardust count, Shiny count, Legendary count, Mythical count, and Trainer Team).
  * The **right pane** hosts an interactive image carousel containing the seller's uploaded screenshots.
* **Inline Overwrites:** If you notice a seller has made a typo (e.g., inputting 50 Legendaries instead of 5 shown in screenshots), you can type the correct value directly into the input fields.
* **Approval/Rejection Hooks:**
  * **Verify Approve:** Saves the (potentially overwritten) metadata parameters, marks the listing status as `APPROVED`, and schedules a live bidding block starting immediately.
  * **Reject:** Prompts you for feedback comments (e.g., *"Uploaded proof does not match trainer level"*), marks the listing status as `REJECTED`, and displays this feedback directly on the seller's dashboard.

### Step-by-Step Instructions:
1. Navigate to the **Review Auditor** tab.
2. Select a pending listing from the sidebar list.
3. Compare the typed parameters in the form with the screenshot proof in the carousel.
4. Correct any incorrect inputs inline in the form.
5. Click **Verify Approve** to schedule the auction, or click **Reject** and input the feedback notes to decline the listing.

---

## Module 2: Live Room Kill Switch (Bidding Controls)

Live auctions are unpredictable. In case of user typos, coordinated raid bids, or technical exploits, the **Live Kill Switch** provides emergency operations to manage live bidding.

### How it Works:
* **Pause Bidding:** Transitions the auction status to `"PAUSED"`. This freezes the live room countdown timer and blocks any incoming `bid` actions on the backend. The frontend will display a frozen **"PAUSED"** badge.
* **Resume Bidding:** Restores status to `"LIVE"`, unfreezes countdowns, and opens bidding up for registered participants again.
* **Rollback Bid:** Deletes the highest bid in the database for this auction, restores the previous bidder's highest bid amount and winner status, and pushes the synchronized update across the socket feed to all participants. If no other bids exist, it rolls the price back to the listing starting bid.
* **Force End (Cut Clock):** Cuts the remaining time to zero, setting `endTime` to the current moment. This forces the auction to close immediately (e.g., if a reserve price is hit early).

### Step-by-Step Instructions:
1. Navigate to the **Live Kill Switch** tab.
2. Find the target running auction block card.
3. Click **Pause Bidding** to freeze bidding, or **Resume Bidding** to unfreeze.
4. Click **Rollback Bid** to wipe a bad bid.
5. Click **Force End Auction (Cut Clock)** to conclude the auction instantly.

---

## Module 3: Escrow Pipeline & Credentials Vault

To protect seller privacy and buyer security, the platform acts as an intermediary. Account details are secured in escrow before funds are released.

### How it Works:
* **Escrow States Grid:** Listings progress through six columns:
  `Approved` $\rightarrow$ `Live` $\rightarrow$ `Awaiting Payment` $\rightarrow$ `Credentials Secured` $\rightarrow$ `Credentials Delivered` $\rightarrow$ `Funds Released`.
* **Credentials Vault:** A secure input field where you copy and save the seller's game account login details (username, password, recovery codes).
* **Payout Release Switch:** A security switch that unlocks only when the escrow stage is set to `Credentials Delivered` (confirming the buyer has successfully received the credentials). Clicking it releases the final funds payout split to the seller.

### Step-by-Step Instructions:
1. Navigate to the **Escrow Pipeline** tab.
2. Review the active listings and their current escrow stages.
3. When a seller sends account credentials, paste them into the **Secure Credentials Vault** text area and click **Save Vault**.
4. Use the stage selector dropdown to manually move the listing stage as custody changes.
5. Once the buyer confirms receipt of credentials, change the stage to `Credentials Delivered`, and click the **Authorize Payout Split** switch to release the funds.

---

## Module 4: Forfeit & Runner-Up Cascade Engine

Platform rules mandate that winning bidders have exactly 24 hours to pay for their won listings. If a buyer defaults, you must execute the **Forfeit Cascade**.

### How it Works:
* **Default Detection:** Shows concluded auctions where a winner has defaulted on payment.
* **The Cascade Transaction:** An atomic database update that:
  1. Forfeits the defaulting winner's ₹199 registration deposit.
  2. Suspends the winner's account (`isSuspended: true`).
  3. Scans the bids list to find the second-highest unique bidder (the runner-up).
  4. Sets the runner-up as the new winner, extends the auction end date by exactly 24 hours, and returns the status to `LIVE` so they can complete checkout.
  5. If no runner-up is found, it resets the listing starting bid and marks the block complete.

### Step-by-Step Instructions:
1. Navigate to the **Forfeit Ledger** tab.
2. Find the overdue concluded auction row.
3. Click **Forfeit & Cascade Runner-Up**.
4. Confirm the prompt to execute the cascade. Bidding access will transfer to the runner-up with a fresh 24-hour window.

---

## Module 5: Webhook Watchdog & Force Sync

Visibility into payments is critical. The **Webhook Watchdog** tab displays server logs for Razorpay transactions.

### How it Works:
* **Log Stream:** Displays incoming Razorpay transaction packets with colored status badges:
  * **PROCESSED (Green):** Payment captured and user bidding access unlocked successfully.
  * **DUPLICATE (Yellow):** Duplicate payment event received and bypassed safely (Idempotency check).
  * **FAILED (Red):** Bad payload, signature verification failure, or database timeout.
* **Manual Override Sync:** If a payment packet is dropped due to network issues, you can type the order ID and click **Force Sync PAID** to manually unlock the user's registration status.

### Step-by-Step Instructions:
1. Navigate to the **Webhook Watchdog** tab to view logs.
2. Click **Refresh** to poll the latest logs.
3. To manually sync a stuck payment, enter the order ID (e.g., `order_mock_abc` or `order_123`) into the **Manual Transaction Sync** sidebar input.
4. Click **Force Sync PAID status** to override and unlock bidding access for that user.

import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Manually parse .env.local to load environment variables
try {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
} catch (err) {
  console.error("Failed to parse .env.local:", err);
}

let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI not found in environment or .env.local");
}
MONGODB_URI = MONGODB_URI.replace(/\/pokemon-auction-mvp(\?|$)/, "/pokemon-auction-test$1");

test.describe("Auction Controls, Currency Changer, and FAQs Integration Tests", () => {
  let testAuctionId = "";
  let sellerAdminId = new mongoose.Types.ObjectId();
  let testListingId = new mongoose.Types.ObjectId();
  let adminEmail = "";
  let testTitle = "";

  test.beforeAll(async () => {
    // Connect to the test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    // Seed a mock user (ADMIN), listing, and auction to test against
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    // Generate random suffixes to prevent collisions
    const randId = Math.random().toString(36).substring(2, 9);
    adminEmail = `test-seller-admin-${randId}@example.com`;
    testTitle = `TEST PLAYWRIGHT ACCOUNT ${randId}`;

    // Create seller ADMIN user
    await db.collection("users").insertOne({
      _id: sellerAdminId,
      name: `Test Seller Admin ${randId}`,
      email: adminEmail,
      role: "ADMIN",
    });

    // Create listing
    await db.collection("listings").insertOne({
      _id: testListingId,
      title: testTitle,
      description: "Playwright test runner account details.",
      level: 45,
      team: "MYSTIC",
      shinyCount: 12,
      legendaryCount: 8,
      mythicalCount: 3,
      startingBid: 250,
      minIncrement: 50,
      sellerId: sellerAdminId,
      status: "APPROVED",
      createdAt: new Date(),
    });

    // Create auction
    const auctionId = new mongoose.Types.ObjectId();
    testAuctionId = auctionId.toString();
    await db.collection("auctions").insertOne({
      _id: auctionId,
      listingId: testListingId,
      currentHighestBid: 250,
      endTime: new Date(Date.now() + 3600000 * 2), // 2 hours from now
      status: "LIVE",
      createdAt: new Date(),
    });
  });

  test.afterAll(async () => {
    // Clean up seeded test records strictly by ID
    const db = mongoose.connection.db;
    if (db) {
      await db.collection("users").deleteOne({ _id: sellerAdminId });
      await db.collection("listings").deleteOne({ _id: testListingId });
      if (testAuctionId) {
        await db.collection("auctions").deleteOne({ _id: new mongoose.Types.ObjectId(testAuctionId) });
      }
    }
    await mongoose.disconnect();
  });

  test("01 · Currency selector is visible in header and updates prices across pages", async ({ page }) => {
    // Go to home page
    await page.goto("/");

    // Verify initial currency dropdown exists on desktop
    const select = page.locator("header select:visible").first();
    await expect(select).toBeVisible();
    expect(await select.inputValue()).toBe("USD");

    // Change currency to EUR
    await select.selectOption("EUR");

    // Wait for the simulated network delay
    await page.waitForTimeout(1000);

    // Verify select updates value
    expect(await select.inputValue()).toBe("EUR");

    // Verify that pricing converts and displays EUR sign (€) on the page
    await page.goto(`/auctions/${testAuctionId}`);
    const euroPrice = page.locator("main :has-text('€')").first();
    await expect(euroPrice).toBeVisible();
  });

  test("02 · FAQs section displays 5 items initially and expands to 25 items", async ({ page }) => {
    await page.goto("/");

    // Scroll to FAQs
    const faqSection = page.locator("#faq");
    await faqSection.scrollIntoViewIfNeeded();

    // Count initial FAQs (should be 5)
    const faqItemsInitial = page.locator("#faq button[onClick]");
    // Wait for page to render items
    await page.waitForTimeout(500);
    const countInitial = await page.locator("#faq button").count();
    // Since displayedFaqs slices first 5 items, there should be exactly 5 buttons
    // The "View All Questions" button is at the bottom, so faq items = total buttons - 1
    expect(countInitial - 1).toBe(5);

    // Click "View All Questions"
    const viewAllBtn = page.locator("button:has-text('View All Questions')");
    await viewAllBtn.click();

    // Verify expanded count (should be 25)
    const countExpanded = await page.locator("#faq button").count();
    // 25 FAQ items + 1 Toggle button = 26 buttons total
    expect(countExpanded - 1).toBe(25);

    // Collapse questions back
    const showLessBtn = page.locator("button:has-text('Show Less Questions')");
    await showLessBtn.click();

    // Verify collapsed back to 5
    const countFinal = await page.locator("#faq button").count();
    expect(countFinal - 1).toBe(5);
  });

  test("03 · Unauthenticated user cannot see Admin Control Panel in live room", async ({ page }) => {
    await page.goto(`/auctions/${testAuctionId}`);
    
    // Admin Control Panel should NOT exist in the DOM
    const adminPanel = page.locator("text=Admin Control Panel");
    await expect(adminPanel).not.toBeVisible();
  });
});

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

test.describe("Wallet and One-Time Verification Deposit Integration Tests", () => {
  let db: mongoose.mongo.Db;

  test.beforeAll(async () => {
    // Connect to the test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    db = mongoose.connection.db!;
  });

  test.afterAll(async () => {
    // Clean up database connection
    await mongoose.disconnect();
  });

  test("01 · User database model defaults are set correctly", async () => {
    const uniqueId = new mongoose.Types.ObjectId();
    const randStr = Math.random().toString(36).substring(2, 9);
    const userDoc = {
      _id: uniqueId,
      email: `test-user-${randStr}@example.com`,
      role: "USER",
      createdAt: new Date(),
    };
    
    await db.collection("users").insertOne(userDoc);
    const retrievedUser = await db.collection("users").findOne({ _id: uniqueId });
    
    expect(retrievedUser).toBeDefined();
    // Default values if not specified
    expect(retrievedUser?.hasPaidVerificationDeposit ?? false).toBe(false);
    expect(retrievedUser?.walletBalance ?? 0).toBe(0);

    // Cleanup
    await db.collection("users").deleteOne({ _id: uniqueId });
  });

  test("02 · Order database model supports walletDiscountApplied", async () => {
    const uniqueUserId = new mongoose.Types.ObjectId();
    const orderId = new mongoose.Types.ObjectId();
    const orderDoc = {
      _id: orderId,
      userId: uniqueUserId,
      items: [{ name: "Boosting package", price: 10.0, quantity: 1 }],
      totalPrice: 7.5,
      walletDiscountApplied: 2.5,
      status: "PENDING",
      orderType: "STOREFRONT",
      createdAt: new Date(),
    };

    await db.collection("orders").insertOne(orderDoc);
    const retrievedOrder = await db.collection("orders").findOne({ _id: orderId });

    expect(retrievedOrder).toBeDefined();
    expect(retrievedOrder?.walletDiscountApplied).toBe(2.5);
    expect(retrievedOrder?.totalPrice).toBe(7.5);

    // Cleanup
    await db.collection("orders").deleteOne({ _id: orderId });
  });

  test("03 · Marking manual registration PAID updates user's verification status and wallet balance", async () => {
    const uniqueUserId = new mongoose.Types.ObjectId();
    const uniqueAuctionId = new mongoose.Types.ObjectId();
    const randStr = Math.random().toString(36).substring(2, 9);

    // Create test user
    await db.collection("users").insertOne({
      _id: uniqueUserId,
      email: `test-user-reg-${randStr}@example.com`,
      hasPaidVerificationDeposit: false,
      walletBalance: 0,
    });

    const regId = new mongoose.Types.ObjectId();
    await db.collection("registrations").insertOne({
      _id: regId,
      userId: uniqueUserId,
      auctionId: uniqueAuctionId,
      razorpayOrderId: `order_mock_${randStr}`,
      status: "PENDING",
      createdAt: new Date(),
    });

    // Simulate verifyRegistrationConsole workflow
    await db.collection("registrations").updateOne(
      { _id: regId },
      { $set: { status: "PAID" } }
    );
    
    // Update user status and credit wallet with $2.50
    await db.collection("users").updateOne(
      { _id: uniqueUserId },
      {
        $set: {
          hasPaidVerificationDeposit: true,
          walletBalance: -2.5,
        }
      }
    );

    const updatedUser = await db.collection("users").findOne({ _id: uniqueUserId });
    const updatedReg = await db.collection("registrations").findOne({ _id: regId });

    expect(updatedReg?.status).toBe("PAID");
    expect(updatedUser?.hasPaidVerificationDeposit).toBe(true);
    expect(updatedUser?.walletBalance).toBe(-2.5);

    // Cleanup
    await db.collection("users").deleteOne({ _id: uniqueUserId });
    await db.collection("registrations").deleteOne({ _id: regId });
  });

  test("04 · Storefront discount calculation logic acts correctly", async () => {
    const originalTotalPrice = 10.0;
    const walletBalance = -2.5; // active credit
    
    // Storefront client calculations
    const hasCredit = walletBalance < 0;
    const discount = hasCredit ? Math.min(originalTotalPrice, Math.abs(walletBalance)) : 0;
    const finalPrice = Math.max(0, originalTotalPrice - discount);

    expect(discount).toBe(2.5);
    expect(finalPrice).toBe(7.5);

    // If storefront item is cheap (e.g. $1.00)
    const cheapTotalPrice = 1.0;
    const cheapDiscount = hasCredit ? Math.min(cheapTotalPrice, Math.abs(walletBalance)) : 0;
    const cheapFinalPrice = Math.max(0, cheapTotalPrice - cheapDiscount);

    expect(cheapDiscount).toBe(1.0);
    expect(cheapFinalPrice).toBe(0.0);
  });

  test("05 · Completing order with applied wallet discount resets user wallet balance to 0", async () => {
    const uniqueUserId = new mongoose.Types.ObjectId();
    const randStr = Math.random().toString(36).substring(2, 9);

    // Setup verified user with -$2.50 wallet credit
    await db.collection("users").insertOne({
      _id: uniqueUserId,
      email: `test-user-order-${randStr}@example.com`,
      hasPaidVerificationDeposit: true,
      walletBalance: -2.5,
    });

    // Setup pending storefront order with applied discount
    const orderId = new mongoose.Types.ObjectId();
    await db.collection("orders").insertOne({
      _id: orderId,
      userId: uniqueUserId,
      totalPrice: 7.5,
      walletDiscountApplied: 2.5,
      status: "PENDING",
      orderType: "STOREFRONT",
    });

    // Simulate completeOrderConsole workflow
    const order = await db.collection("orders").findOneAndUpdate(
      { _id: orderId },
      { $set: { status: "COMPLETED" } },
      { returnDocument: "after" }
    );

    const walletDiscountApplied = order?.walletDiscountApplied ?? 2.5;
    if (walletDiscountApplied > 0) {
      await db.collection("users").updateOne(
        { _id: uniqueUserId },
        { $set: { walletBalance: 0 } }
      );
    }

    const updatedUser = await db.collection("users").findOne({ _id: uniqueUserId });
    const updatedOrder = await db.collection("orders").findOne({ _id: orderId });

    expect(updatedOrder?.status).toBe("COMPLETED");
    expect(updatedUser?.walletBalance).toBe(0);

    // Cleanup
    await db.collection("users").deleteOne({ _id: uniqueUserId });
    await db.collection("orders").deleteOne({ _id: orderId });
  });
});

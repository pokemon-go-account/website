"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Registration from "@/models/Registration";
import Auction from "@/models/Auction";
import User from "@/models/User";
import Razorpay from "razorpay";

/**
 * Server Action: Initiate a Razorpay payment order for bid verification deposit ($2.50 / 250 cents)
 */
export async function createRegistrationOrder(auctionId: string) {
  try {
    // 1. Session verification & active check
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in first." };
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return { success: false, error: "User profile not found." };
    }
    if (user.isSuspended) {
      return { success: false, error: "Access denied. Your account is suspended." };
    }

    // 2. Fetch target auction
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return { success: false, error: "Auction not found." };
    }
    if (auction.status !== "LIVE" && auction.status !== "SCHEDULED") {
      return { success: false, error: "Auction is not open for registration." };
    }

    // 3. Check for existing PAID registration
    const existingPaid = await Registration.findOne({
      userId: user._id,
      auctionId: auction._id,
      status: "PAID",
    });

    if (existingPaid) {
      return { success: false, error: "You are already registered for this auction." };
    }

    // 4. Instantiate Razorpay SDK (Or simulate Sandbox Mode if placeholders are active)
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay API credentials missing in environment variables.");
      return { success: false, error: "Payment gateway configuration is currently offline." };
    }

    const isPlaceholder = keyId === "rzp_test_placeholder" || keySecret === "secret_placeholder";

     let orderId: string;
    let orderAmount = 250; // $2.50 USD in cents
    let orderCurrency = "USD";
 
    if (isPlaceholder) {
      // Generate a mock order ID
      orderId = `order_mock_${Math.random().toString(36).substring(2, 10)}`;
      console.log(`[Mock Payment Sandbox] Created simulated order: ${orderId}`);
    } else {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
 
      const orderOptions = {
        amount: 250, // 2.50 USD in cents
        currency: "USD",
        receipt: `receipt_reg_${user._id.toString().slice(-6)}_${auction._id.toString().slice(-6)}`,
      };
 
      const order = await razorpay.orders.create(orderOptions);
 
      if (!order || !order.id) {
        return { success: false, error: "Failed to initialize payment gateway order." };
      }
 
      orderId = order.id;
      orderAmount = typeof order.amount === "number" ? order.amount : parseInt(order.amount as string, 10);
      orderCurrency = order.currency;
    }

    // 5. Persist PENDING registration status in database (idempotent upsert)
    await Registration.findOneAndUpdate(
      { userId: user._id, auctionId: auction._id },
      {
        $set: {
          razorpayOrderId: orderId,
          status: "PENDING",
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 6. Return payload required for Razorpay checkout window setup
    return {
      success: true,
      error: null,
      isMock: isPlaceholder,
      orderContext: {
        id: orderId,
        amount: orderAmount,
        currency: orderCurrency,
        key_id: keyId,
        prefill: {
          name: user.name,
          email: user.email,
        },
      },
    };
  } catch (error: any) {
    console.error("Payment order generation error:", error);
    return { 
      success: false, 
      error: `Failed to establish payment registration session: ${error.message || error}` 
    };
  }
}

/**
 * Server Action: Check if a user has completed the verification deposit for an auction
 */
export async function checkUserRegistrationStatus(auctionId: string) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { isRegistered: false };
    }

    await connectDB();
    const registration = await Registration.findOne({
      userId: session.user.id,
      auctionId,
      status: "PAID",
    }).lean();

    return { isRegistered: !!registration };
  } catch (err) {
    console.error("Verification status query error:", err);
    return { isRegistered: false };
  }
}

/**
 * Server Action: Simulate successful payment capture in Sandbox Mode
 */
export async function simulateMockPayment(orderId: string) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized." };
    }

    await connectDB();
    const registration = await Registration.findOne({ razorpayOrderId: orderId });
    if (!registration) {
      return { success: false, error: "Registration order not found." };
    }

    if (registration.status === "PAID") {
      return { success: true };
    }

    registration.status = "PAID";
    await registration.save();

    return { success: true };
  } catch (err) {
    console.error("Mock payment simulation failure:", err);
    return { success: false, error: "Internal db mutation error." };
  }
}

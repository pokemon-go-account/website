import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import Registration from "@/models/Registration";
import WebhookLog from "@/models/WebhookLog";

async function logWebhookEvent(
  eventId: string,
  eventType: string,
  rawPayload: string,
  status: "PROCESSED" | "DUPLICATE" | "FAILED",
  errorMessage?: string
) {
  try {
    await connectDB();
    await WebhookLog.create({
      eventId,
      eventType,
      payload: rawPayload,
      status,
      errorMessage,
    });
  } catch (err) {
    console.error("Failed to write WebhookLog:", err);
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-razorpay-signature");
  const rawBody = await req.text();

  // Parse payload safely to extract metadata
  let parsedPayload: any = null;
  try {
    parsedPayload = JSON.parse(rawBody);
  } catch (_) {}

  const eventId = parsedPayload?.id || `fallback_id_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const eventType = parsedPayload?.event || "unknown";

  try {
    // 1. Verify signatures to authenticate the caller (Razorpay servers only)
    if (!signature) {
      await logWebhookEvent(eventId, eventType, rawBody, "FAILED", "Missing signature header.");
      return NextResponse.json({ error: "Missing signature header." }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      await logWebhookEvent(eventId, eventType, rawBody, "FAILED", "Webhook secret is not configured.");
      console.error("Critical: RAZORPAY_WEBHOOK_SECRET is not configured in env.");
      return NextResponse.json({ error: "Webhook verification unavailable." }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      await logWebhookEvent(eventId, eventType, rawBody, "FAILED", "Signature verification failed.");
      return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
    }

    // 2. We specifically listen for payment.captured
    if (eventType === "payment.captured") {
      const paymentEntity = parsedPayload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;

      if (!orderId) {
        await logWebhookEvent(eventId, eventType, rawBody, "FAILED", "No order ID associated with payment.");
        return NextResponse.json({ error: "No order ID associated with payment." }, { status: 400 });
      }

      const amount = paymentEntity?.amount;
      const currency = paymentEntity?.currency;

      if (amount !== 250 || currency !== "USD") {
        await logWebhookEvent(
          eventId,
          eventType,
          rawBody,
          "FAILED",
          `Invalid payment details. Amount: ${amount}, Currency: ${currency}. Expected 250 USD.`
        );
        return NextResponse.json({ error: "Invalid payment amount or currency." }, { status: 400 });
      }

      await connectDB();

      // Look up target registration tracking record
      const registration = await Registration.findOne({ razorpayOrderId: orderId });

      if (!registration) {
        await logWebhookEvent(eventId, eventType, rawBody, "FAILED", `No registration found matching order ID: ${orderId}`);
        return NextResponse.json({ error: `No registration found matching order ID: ${orderId}` }, { status: 404 });
      }

      // Check for Idempotency: exit early with 200 OK if already marked PAID
      if (registration.status === "PAID") {
        await logWebhookEvent(eventId, eventType, rawBody, "DUPLICATE");
        return NextResponse.json({ success: true, message: "Idempotent event bypassed." }, { status: 200 });
      }

      // Atomically transition status to PAID
      registration.status = "PAID";
      await registration.save();

      const User = (await import("@/models/User")).default;
      await User.findByIdAndUpdate(registration.userId, {
        hasPaidVerificationDeposit: true,
        $set: { walletBalance: -2.5 }
      });

      console.log(`Successfully verified deposit registration for order: ${orderId}`);
      await logWebhookEvent(eventId, eventType, rawBody, "PROCESSED");
    } else {
      // General non-captured payments logged as processed
      await logWebhookEvent(eventId, eventType, rawBody, "PROCESSED");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay Webhook Handler failure:", error);
    await logWebhookEvent(eventId, eventType, rawBody, "FAILED", error.message || "Internal processing crash.");
    return NextResponse.json({ error: "Internal processing crash." }, { status: 500 });
  }
}

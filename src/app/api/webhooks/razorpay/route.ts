import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import Registration from "@/models/Registration";

export async function POST(req: Request) {
  try {
    // 1. Verify signatures to authenticate the caller (Razorpay servers only)
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature header." }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Critical: RAZORPAY_WEBHOOK_SECRET is not configured in env.");
      return NextResponse.json({ error: "Webhook verification unavailable." }, { status: 500 });
    }

    // Read raw body stream
    const rawBody = await req.text();

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
    }

    // 2. Parse payload safely
    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // We specifically listen for payment.captured
    if (event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;

      if (!orderId) {
        return NextResponse.json({ error: "No order ID associated with payment." }, { status: 400 });
      }

      await connectDB();

      // Look up target registration tracking record
      const registration = await Registration.findOne({ razorpayOrderId: orderId });

      if (!registration) {
        return NextResponse.json({ error: `No registration found matching order ID: ${orderId}` }, { status: 404 });
      }

      // Check for Idempotency: exit early with 200 OK if already marked PAID
      if (registration.status === "PAID") {
        return NextResponse.json({ success: true, message: "Idempotent event bypassed." }, { status: 200 });
      }

      // Atomically transition status to PAID
      registration.status = "PAID";
      await registration.save();

      console.log(`Successfully verified deposit registration for order: ${orderId}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay Webhook Handler failure:", error);
    return NextResponse.json({ error: "Internal processing crash." }, { status: 500 });
  }
}

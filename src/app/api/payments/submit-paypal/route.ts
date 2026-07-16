import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PaypalPayment from "@/models/PaypalPayment";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { orderId, amount, customerEmail, transactionId, screenshotBase64 } = body;

    // 2. Validate required fields
    if (!orderId || !amount || !customerEmail || !transactionId || !screenshotBase64) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (typeof transactionId !== "string" || transactionId.trim().length < 5) {
      return NextResponse.json(
        { error: "Please enter a valid PayPal Transaction ID." },
        { status: 400 }
      );
    }

    // 3. Verify order ownership (IDOR protection)
    const Order = (await import("@/models/Order")).default;
    const order = await Order.findOne({ _id: orderId, userId: session.user.id });
    if (!order) {
      return NextResponse.json(
        { error: "Order not found or does not belong to your account." },
        { status: 403 }
      );
    }

    // 4. Server-side amount: always use the DB order total, ignore client-sent amount
    // (clients display amounts in local currency EUR/crypto/etc. which won't match the USD total)
    const expectedAmount = order.totalPrice;

    // 5. Upload to Cloudinary
    let screenshotUrl = "";
    try {
      screenshotUrl = await uploadToCloudinary(screenshotBase64);
    } catch (uploadErr) {
      console.error("[Cloudinary Payment Upload Failed]", uploadErr);
      return NextResponse.json(
        { error: "Failed to upload payment screenshot to Cloudinary." },
        { status: 500 }
      );
    }

    const payment = await PaypalPayment.create({
      orderId,
      amount: expectedAmount,
      customerEmail,
      transactionId,
      screenshotUrl,
      status: "Pending",
    });

    return NextResponse.json({ success: true, paymentId: payment._id.toString(), screenshotUrl }, { status: 201 });
  } catch (err: any) {
    console.error("[PayPal Payment Submit Error]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}


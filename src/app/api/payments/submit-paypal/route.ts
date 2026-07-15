import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PaypalPayment from "@/models/PaypalPayment";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { orderId, amount, customerEmail, transactionId, screenshotBase64 } = body;

    // Validate required fields
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

    // Upload to Cloudinary (will fall back to mock sandbox if keys are unconfigured)
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
      amount: Number(amount),
      customerEmail,
      transactionId,
      screenshotUrl,
      status: "Pending",
    });

    return NextResponse.json({ success: true, paymentId: payment._id.toString() }, { status: 201 });
  } catch (err: any) {
    console.error("[PayPal Payment Submit Error]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

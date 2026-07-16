import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WisePayment from "@/models/WisePayment";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { orderId, amount, currency, customerEmail, transactionReference, screenshotBase64 } = body;

    // Validate required fields (excluding transactionReference)
    if (!orderId || !amount || !currency || !customerEmail || !screenshotBase64) {
      return NextResponse.json(
        { error: "Required fields are missing." },
        { status: 400 }
      );
    }

    const finalTxRef = transactionReference && typeof transactionReference === "string" && transactionReference.trim().length > 0
      ? transactionReference.trim()
      : "N/A";

    // Upload screenshot to Cloudinary
    let screenshotUrl = "";
    try {
      screenshotUrl = await uploadToCloudinary(screenshotBase64);
    } catch (uploadErr) {
      console.error("[Cloudinary Wise Payment Upload Failed]", uploadErr);
      return NextResponse.json(
        { error: "Failed to upload payment screenshot to Cloudinary." },
        { status: 500 }
      );
    }

    const payment = await WisePayment.create({
      orderId,
      amount: Number(amount),
      currency,
      customerEmail,
      transactionReference: finalTxRef,
      screenshotUrl,
      status: "Pending",
    });

    return NextResponse.json({ success: true, paymentId: payment._id.toString(), screenshotUrl }, { status: 201 });
  } catch (err: any) {
    console.error("[Wise Payment Submit Error]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

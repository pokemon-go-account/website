import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CryptoPayment from "@/models/CryptoPayment";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { orderId, amount, customerEmail, coinSelected, txHash, screenshotBase64 } = body;

    // Validate required fields
    if (!orderId || !amount || !customerEmail || !coinSelected || !txHash || !screenshotBase64) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (typeof txHash !== "string" || txHash.trim().length < 8) {
      return NextResponse.json(
        { error: "Please enter a valid Crypto Transaction Hash (TxHash)." },
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

    const payment = await CryptoPayment.create({
      orderId,
      amount: Number(amount),
      customerEmail,
      coinSelected,
      txHash,
      screenshotUrl,
      status: "Pending",
    });

    return NextResponse.json({ success: true, paymentId: payment._id.toString() }, { status: 201 });
  } catch (err: any) {
    console.error("[Crypto Payment Submit Error]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

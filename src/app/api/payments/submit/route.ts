import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/Payment";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { orderId, amount, customerEmail, utrNumber, screenshotBase64 } = body;

    // Validate required fields
    if (!orderId || !amount || !customerEmail || !utrNumber || !screenshotBase64) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (typeof utrNumber !== "string" || utrNumber.length > 12 || !/^\d+$/.test(utrNumber)) {
      return NextResponse.json(
        { error: "UTR number must be up to 12 digits." },
        { status: 400 }
      );
    }

    const payment = await Payment.create({
      orderId,
      amount: Number(amount),
      customerEmail,
      utrNumber,
      screenshotBase64,
      status: "Pending",
    });

    return NextResponse.json({ success: true, paymentId: payment._id.toString() }, { status: 201 });
  } catch (err: any) {
    console.error("[Payment Submit Error]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

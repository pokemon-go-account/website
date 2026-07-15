import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICryptoPayment extends Document {
  orderId: string;
  amount: number; // in USD
  customerEmail: string;
  coinSelected: string; // e.g., "USDT (TRC20)", "BTC", etc.
  txHash: string;
  screenshotUrl: string;
  status: "Pending" | "Verified" | "Rejected";
  createdAt: Date;
}

const CryptoPaymentSchema = new Schema<ICryptoPayment>(
  {
    orderId: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    coinSelected: { type: String, required: true },
    txHash: { type: String, required: true, trim: true },
    screenshotUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

CryptoPaymentSchema.index({ status: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.CryptoPayment) {
  delete (mongoose.models as any).CryptoPayment;
}

const CryptoPayment: Model<ICryptoPayment> = mongoose.model<ICryptoPayment>("CryptoPayment", CryptoPaymentSchema);

export default CryptoPayment;

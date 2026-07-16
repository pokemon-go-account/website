import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWisePayment extends Document {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  transactionReference: string;
  screenshotUrl: string;
  status: "Pending" | "Verified" | "Rejected";
  createdAt: Date;
}

const WisePaymentSchema = new Schema<IWisePayment>(
  {
    orderId: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "USD" },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    transactionReference: { type: String, required: false, default: "N/A", trim: true },
    screenshotUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

WisePaymentSchema.index({ status: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.WisePayment) {
  delete (mongoose.models as any).WisePayment;
}

const WisePayment: Model<IWisePayment> = mongoose.model<IWisePayment>("WisePayment", WisePaymentSchema);

export default WisePayment;

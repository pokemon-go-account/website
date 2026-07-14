import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  orderId: string;
  amount: number;
  customerEmail: string;
  utrNumber: string;
  screenshotUrl: string;
  status: "Pending" | "Verified" | "Rejected";
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    utrNumber: { type: String, required: true, trim: true, maxlength: 12 },
    screenshotUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ status: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.Payment) {
  delete (mongoose.models as any).Payment;
}

const Payment: Model<IPayment> = mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;

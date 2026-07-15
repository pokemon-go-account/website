import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaypalPayment extends Document {
  orderId: string;
  amount: number;
  customerEmail: string;
  transactionId: string;
  screenshotUrl: string;
  status: "Pending" | "Verified" | "Rejected";
  createdAt: Date;
}

const PaypalPaymentSchema = new Schema<IPaypalPayment>(
  {
    orderId: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    transactionId: { type: String, required: true, trim: true },
    screenshotUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

PaypalPaymentSchema.index({ status: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.PaypalPayment) {
  delete (mongoose.models as any).PaypalPayment;
}

const PaypalPayment: Model<IPaypalPayment> = mongoose.model<IPaypalPayment>("PaypalPayment", PaypalPaymentSchema);

export default PaypalPayment;

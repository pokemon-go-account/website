import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: Array<{
    productId?: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  walletDiscountApplied?: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  orderType: "STOREFRONT" | "BUY_NOW" | "AUCTION" | "RECOVERY";
  auctionId?: mongoose.Types.ObjectId;
  deliveryStatus?: "PENDING" | "PAYMENT_RECEIVED" | "DELIVERED";
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    walletDiscountApplied: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
      required: true,
    },
    orderType: {
      type: String,
      enum: ["STOREFRONT", "BUY_NOW", "AUCTION", "RECOVERY"],
      required: true,
    },
    auctionId: { type: Schema.Types.ObjectId, ref: "Auction" },
    deliveryStatus: {
      type: String,
      enum: ["PENDING", "PAYMENT_RECEIVED", "DELIVERED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, status: 1 });

if (mongoose.models.Order) {
  delete (mongoose.models as any).Order;
}

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;

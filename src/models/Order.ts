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
  status: "PENDING" | "COMPLETED" | "FAILED";
  orderType: "STOREFRONT" | "BUY_NOW" | "AUCTION";
  auctionId?: mongoose.Types.ObjectId;
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
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
      required: true,
    },
    orderType: {
      type: String,
      enum: ["STOREFRONT", "BUY_NOW", "AUCTION"],
      required: true,
    },
    auctionId: { type: Schema.Types.ObjectId, ref: "Auction" },
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, status: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;

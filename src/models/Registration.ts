import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRegistration extends Document {
  userId: mongoose.Types.ObjectId;
  auctionId?: mongoose.Types.ObjectId | null;
  razorpayOrderId: string;
  status: "PENDING" | "PAID" | "FAILED";
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema: Schema<IRegistration> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    auctionId: { type: Schema.Types.ObjectId, ref: "Auction", required: false, default: null },
    razorpayOrderId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      required: true,
    },
  },
  { timestamps: true }
);

// Unique compound index so a user can never register twice for the same auction
RegistrationSchema.index({ userId: 1, auctionId: 1 }, { unique: true });

const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>("Registration", RegistrationSchema);

export default Registration;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomRequest extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  email: string;
  requestType: "POKEMON" | "ACCOUNT" | "STARDUST" | "XP";
  title: string;
  description: string;
  socialPlatform: string;
  socialId: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}

const CustomRequestSchema: Schema<ICustomRequest> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    requestType: { type: String, enum: ["POKEMON", "ACCOUNT", "STARDUST", "XP"], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    socialPlatform: { type: String, required: true, trim: true },
    socialId: { type: String, required: true, trim: true },
    status: { type: String, enum: ["PENDING", "COMPLETED", "REJECTED"], default: "PENDING" },
  },
  { timestamps: true }
);

CustomRequestSchema.index({ userId: 1 });
CustomRequestSchema.index({ requestType: 1 });
CustomRequestSchema.index({ status: 1 });
CustomRequestSchema.index({ createdAt: -1 });

const CustomRequest: Model<ICustomRequest> =
  mongoose.models.CustomRequest || mongoose.model<ICustomRequest>("CustomRequest", CustomRequestSchema);

export default CustomRequest;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecoveryRequest extends Document {
  userId: mongoose.Types.ObjectId;
  accountLevel: number;
  screenshotUrl: string;
  screenshotUrls?: string[];
  startDate: Date;
  creationMethod: string;
  contactMethod: string;
  contactId: string;
  alternateContact?: string;
  hasEmailAccess: boolean;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryRequestSchema: Schema<IRecoveryRequest> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    accountLevel: { type: Number, required: true, min: 1, max: 100 },
    screenshotUrl: { type: String, required: false },
    screenshotUrls: { type: [String], default: [] },
    startDate: { type: Date, required: true },
    creationMethod: { type: String, required: true },
    contactMethod: { type: String, required: true },
    contactId: { type: String, required: true, trim: true },
    alternateContact: { type: String, trim: true },
    hasEmailAccess: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

RecoveryRequestSchema.index({ userId: 1 });
RecoveryRequestSchema.index({ status: 1 });
RecoveryRequestSchema.index({ createdAt: -1 });

const RecoveryRequest: Model<IRecoveryRequest> =
  mongoose.models.RecoveryRequest || mongoose.model<IRecoveryRequest>("RecoveryRequest", RecoveryRequestSchema);

export default RecoveryRequest;

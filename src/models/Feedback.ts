import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeedback extends Document {
  username: string;
  rating: number;
  comment: string;
  userId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema<IFeedback> = new Schema(
  {
    username: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: false },
  },
  { timestamps: true }
);

FeedbackSchema.index({ createdAt: -1 });

const Feedback: Model<IFeedback> =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);

export default Feedback;

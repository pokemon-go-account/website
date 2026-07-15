import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWaitlist extends Document {
  email: string;
  createdAt: Date;
}

const WaitlistSchema: Schema<IWaitlist> = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

const Waitlist: Model<IWaitlist> =
  mongoose.models.Waitlist || mongoose.model<IWaitlist>('Waitlist', WaitlistSchema);

export default Waitlist;

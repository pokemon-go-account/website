import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBid extends Document {
  auctionId: mongoose.Types.ObjectId;
  bidderId: mongoose.Types.ObjectId;
  amount: number;
  createdAt: Date;
}

const BidSchema: Schema<IBid> = new Schema(
  {
    auctionId: { type: Schema.Types.ObjectId, ref: 'Auction', required: true },
    bidderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true } // Provides createdAt timestamp out-of-the-box
);

// High-Concurrency Compound Index
// Ensures we can query the highest bid for an auction instantly without an expensive collection scan.
BidSchema.index({ auctionId: 1, amount: -1 });

const Bid: Model<IBid> = mongoose.models.Bid || mongoose.model<IBid>('Bid', BidSchema);
export default Bid;
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuction extends Document {
  listingId: mongoose.Types.ObjectId;
  currentHighestBid: number;
  highestBidderId?: mongoose.Types.ObjectId;
  startTime?: Date;
  endTime?: Date;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  registrationFee: number;
}

const AuctionSchema: Schema<IAuction> = new Schema(
  {
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, unique: true },
    currentHighestBid: { type: Number, required: true },
    highestBidderId: { type: Schema.Types.ObjectId, ref: 'User' },
    startTime: { type: Date },
    endTime: { type: Date },
    status: { 
      type: String, 
      enum: ['SCHEDULED', 'LIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'], 
      default: 'SCHEDULED' 
    },
    registrationFee: { type: Number, default: 199 }, // Default entry fee constraint
  },
  { timestamps: true }
);

// Critical indexes for live querying and chronological grouping
AuctionSchema.index({ status: 1, startTime: 1 });

const Auction: Model<IAuction> = mongoose.models.Auction || mongoose.model<IAuction>('Auction', AuctionSchema);
export default Auction;
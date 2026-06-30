import mongoose, { Schema, Document, Model } from 'mongoose';
import { ListingValidationSchema } from './Listing.validation';

export interface IListing extends Document {
  sellerId: mongoose.Types.ObjectId;
  telegramUsername: string; // Internal-only validation field
  title: string;
  description: string;
  level: number;
  xp: number;
  stardust: number;
  team: 'MYSTIC' | 'VALOR' | 'INSTINCT' | 'NONE';
  shinyCount: number;
  legendaryCount: number;
  mythicalCount: number;
  region: string;
  screenshots: string[];
  startingBid: number;
  reservePrice: number;
  minIncrement: number;
  durationHours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

const ListingSchema: Schema<IListing> = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    telegramUsername: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    level: { type: Number, required: true },
    xp: { type: Number, required: true },
    stardust: { type: Number, required: true },
    team: { type: String, enum: ['MYSTIC', 'VALOR', 'INSTINCT', 'NONE'], required: true },
    shinyCount: { type: Number, default: 0 },
    legendaryCount: { type: Number, default: 0 },
    mythicalCount: { type: Number, default: 0 },
    region: { type: String, required: true },
    screenshots: [{ type: String, required: true }],
    startingBid: { type: Number, required: true },
    reservePrice: { type: Number, required: true },
    minIncrement: { type: Number, required: true },
    durationHours: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

ListingSchema.index({ sellerId: 1, status: 1 });

const Listing: Model<IListing> = mongoose.models.Listing || mongoose.model<IListing>('Listing', ListingSchema);
export default Listing;
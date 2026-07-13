import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description?: string;
  price: number;
  mrpPrice: number;
  discountedPrice: number;
  isLimitedDeal?: boolean;
  dealExpiry?: Date;
  badge?: "MOST_PURCHASED" | "POPULAR" | "";
  categoryId: mongoose.Types.ObjectId;
  imageUrl: string;
  imageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    mrpPrice: { type: Number, required: true, min: 0, default: 0 },
    discountedPrice: { type: Number, required: true, min: 0, default: 0 },
    isLimitedDeal: { type: Boolean, default: false },
    dealExpiry: { type: Date, default: null },
    badge: { type: String, enum: ["MOST_PURCHASED", "POPULAR", ""], default: "" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    imageUrl: { type: String, required: true },
    imageUrls: { type: [String], default: [] },
  },
  { timestamps: true }
);

ProductSchema.index({ categoryId: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;

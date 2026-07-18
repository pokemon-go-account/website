import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPageView extends Document {
  visitorId: string;
  path: string;
  country: string;
  countryCode: string;
  referrer?: string;
  device?: string;
  browser?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PageViewSchema: Schema<IPageView> = new Schema(
  {
    visitorId: { type: String, required: true, index: true },
    path: { type: String, required: true, index: true },
    country: { type: String, required: true, default: "Unknown" },
    countryCode: { type: String, required: true, default: "UN", index: true },
    referrer: { type: String, default: "" },
    device: { type: String, default: "desktop" },
    browser: { type: String, default: "Unknown" },
  },
  { timestamps: true }
);

PageViewSchema.index({ createdAt: -1 });
PageViewSchema.index({ countryCode: 1, createdAt: -1 });
PageViewSchema.index({ path: 1, createdAt: -1 });

const PageView: Model<IPageView> =
  mongoose.models.PageView || mongoose.model<IPageView>("PageView", PageViewSchema);

export default PageView;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface INewsArticle extends Document {
  articleId: string; // Unique SEO-friendly ID / slug e.g. "pokemon-go-wild-area-2026-guide"
  title: string;
  excerpt: string;
  content: string;
  category: "Updates" | "Guides & Events" | "Marketplace" | "Security" | "Community";
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  coverImage: string;
  tags: string[];
  publishedAt: Date;
  readTime: string;
  featured: boolean;
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NewsArticleSchema: Schema<INewsArticle> = new Schema(
  {
    articleId: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Updates", "Guides & Events", "Marketplace", "Security", "Community"],
      default: "Updates",
    },
    author: {
      name: { type: String, required: true, default: "Pokémon GO Services Team" },
      role: { type: String, default: "Editor" },
      avatar: { type: String, default: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80" },
    },
    coverImage: { type: String, required: true },
    tags: [{ type: String }],
    publishedAt: { type: Date, default: Date.now },
    readTime: { type: String, default: "5 min read" },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    seoTitle: { type: String },
    seoDescription: { type: String },
    seoKeywords: [{ type: String }],
  },
  { timestamps: true }
);

NewsArticleSchema.index({ publishedAt: -1 });
NewsArticleSchema.index({ category: 1, publishedAt: -1 });

const NewsArticle: Model<INewsArticle> =
  mongoose.models.NewsArticle || mongoose.model<INewsArticle>("NewsArticle", NewsArticleSchema);

export default NewsArticle;

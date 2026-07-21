import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import {
  createNewsArticle,
  updateNewsArticle,
  deleteNewsArticle,
  getAllNewsArticles,
  getNewsArticleById,
  incrementArticleViews,
} from "@/features/news/actions";
import NewsArticle from "@/models/NewsArticle";
import { auth } from "@/auth";

// Mock Cloudinary helpers
vi.mock("@/lib/cloudinary", () => ({
  deleteFromCloudinary: vi.fn().mockResolvedValue({ success: true }),
  uploadToCloudinary: vi.fn().mockResolvedValue({ success: true, secure_url: "https://example.com/news.jpg" }),
}));

const ARTICLE_FIXTURE = {
  articleId: "new-go-wild-event",
  title: "New Go Wild Event",
  excerpt: "Everything you need to know about the upcoming Go Wild event.",
  content: "Detailed content about the event with schedules and rewards.",
  category: "Guides & Events" as const,
  coverImage: "https://example.com/cover.jpg",
  tags: ["Wild Area", "Event"],
  readTime: "5 min read",
};

describe("News Actions", () => {
  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await NewsArticle.deleteMany({});
    vi.clearAllMocks();
  });

  describe("Security Gates", () => {
    it("should fail to create article if user is not admin", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user1", role: "USER" }, expires: "9999" } as any);
      const res = await createNewsArticle(ARTICLE_FIXTURE);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });
  });

  describe("CRUD Operations", () => {
    it("should successfully create, read, update, and delete news articles", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "ADMIN" }, expires: "9999" } as any);

      // Create
      const resCreate = await createNewsArticle(ARTICLE_FIXTURE);
      expect(resCreate.success).toBe(true);
      expect(resCreate.articleId).toBe("new-go-wild-event");

      // Read List
      const articles = await getAllNewsArticles();
      expect(articles.length).toBe(1);
      expect(articles[0].title).toBe("New Go Wild Event");

      // Read Single
      const article = await getNewsArticleById("new-go-wild-event");
      expect(article).not.toBeNull();
      expect(article?.excerpt).toBe("Everything you need to know about the upcoming Go Wild event.");

      // Update
      const resUpdate = await updateNewsArticle(article!.articleId, {
        title: "New Go Wild Event 2026",
      });
      expect(resUpdate.success).toBe(true);

      // Query by articleId slug
      const updatedBySlug = await NewsArticle.findOne({ articleId: "new-go-wild-event" });
      expect(updatedBySlug?.title).toBe("New Go Wild Event 2026");

      // Delete
      const resDelete = await deleteNewsArticle("new-go-wild-event");
      expect(resDelete.success).toBe(true);

      const deleted = await NewsArticle.findOne({ articleId: "new-go-wild-event" });
      expect(deleted).toBeNull();
    });

    it("should increment article view counts successfully", async () => {
      const art = await NewsArticle.create({
        ...ARTICLE_FIXTURE,
        articleId: "test-views-article",
        author: { name: "Test Author", role: "Writer", avatar: "https://example.com/avatar.jpg" },
        publishedAt: new Date(),
        views: 0,
      });

      await incrementArticleViews(art.articleId);

      const updated = await NewsArticle.findById(art._id);
      expect(updated?.views).toBe(1);
    });
  });
});

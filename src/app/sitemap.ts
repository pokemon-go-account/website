import type { MetadataRoute } from "next";
import connectDB from "@/lib/db";
import Auction from "@/models/Auction";
import { getAllNewsArticles } from "@/features/news/actions";

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : "https://pokemongoservices.com";

  const currentDate = new Date();

  // Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/auctions`,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/become-a-seller`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/recovery`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic Auction pages
  let auctionRoutes: MetadataRoute.Sitemap = [];
  try {
    await connectDB();
    const auctions = await Auction.find({})
      .select("_id updatedAt createdAt")
      .lean();

    auctionRoutes = auctions.map((auction: any) => ({
      url: `${baseUrl}/auctions/${auction._id.toString()}`,
      lastModified: auction.updatedAt
        ? new Date(auction.updatedAt)
        : auction.createdAt
        ? new Date(auction.createdAt)
        : currentDate,
      changeFrequency: "hourly",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("[Sitemap] Error fetching auctions:", error);
  }

  // Dynamic News & Articles pages
  let newsRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getAllNewsArticles();
    newsRoutes = articles.map((article) => ({
      url: `${baseUrl}/news/${article.articleId}`,
      lastModified: article.publishedAt
        ? new Date(article.publishedAt)
        : currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[Sitemap] Error fetching news articles:", error);
  }

  return [...staticRoutes, ...auctionRoutes, ...newsRoutes];
}

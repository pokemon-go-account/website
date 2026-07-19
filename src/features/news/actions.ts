"use server";

import mongoose from "mongoose";
import connectDB from "@/lib/db";
import NewsArticle from "@/models/NewsArticle";
import { ArticleData, ArticleInputData } from "./types";

const SEED_ARTICLES: ArticleData[] = [
  {
    articleId: "pokemon-go-wild-area-2026-event-guide",
    title: "Pokémon GO Wild Area 2026: Complete Strategy, Rare Spawns & Shiny Odds Guide",
    excerpt: "Everything you need to know about the upcoming Wild Area 2026 event including rare Mighty Pokémon spawns, exclusive movesets, and optimal raiding strategies.",
    category: "Guides & Events",
    author: {
      name: "Professor Oak",
      role: "Lead Game Analyst",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    coverImage: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=1200&auto=format&fit=crop&q=80",
    tags: ["Wild Area", "Event Guide", "Shiny Odds", "Master League", "Raids"],
    publishedAt: "2026-07-15T10:00:00.000Z",
    readTime: "6 min read",
    featured: true,
    views: 1420,
    seoTitle: "Pokémon GO Wild Area 2026 Strategy & Shiny Odds Guide",
    seoDescription: "Comprehensive guide to Pokémon GO Wild Area 2026 featuring Mighty Pokémon encounter strategies, shiny rates, raid counters, and PvP moveset breakdown.",
    seoKeywords: ["Pokemon GO Wild Area 2026", "Pokemon GO Guide", "Shiny Odds", "Mighty Pokemon", "PvP Tier List"],
    content: `
# Pokémon GO Wild Area 2026: Complete Strategy Guide

The **Wild Area 2026** is officially here, bringing unprecedented encounters, brand new Mighty Pokémon, and unprecedented shiny boosted odds! Whether you are hunting high-IV Level 50 Shinies or building your ultimate Master League roster, this comprehensive guide has you covered.

---

## 🌟 Key Highlights & Event Mechanics

1. **Mighty Pokémon Spawns**:
   - Mighty Pokémon feature guaranteed **3-star IVs** (minimum 13/13/13).
   - Higher catch rates when utilizing Ultra Balls paired with Silver Pinap Berries.
   - Boosted XL Candy drop rates upon capture.

2. **Featured Shiny Rates**:
   - Event Wild Spawns: Approximately **1 in 64** shiny rate for featured species.
   - 5-Star Raid Bosses: **1 in 20** shiny chance.

---

## 🗡️ Recommended Raid Counters & Teams

To maximize your raid Premier Balls and XL candy gains, ensure your team utilizes Level 80+ Shadow Counters:

- **Primal Groudon**: Mud Shot + Precipice Blades (Top Ground Attacker)
- **Mega Rayquaza**: Dragon Tail + Dragon Ascent (Top Generalist)
- **Shadow Mewtwo**: Psycho Cut + Psystrike (Versatile Neutral DPS)

> 💡 **Pro-Tip**: Ensure your Mega Evolution active bonus matches the primary type of your target boss to stack maximum Bonus XL Candies per raid!

---

## 🛡️ PvP & Master League Impact

Several event-exclusive moves are making their debut. The most impactful is **Origin Forme Palkia with Spacial Rend**, which continues to dominate the top spot in GO Battle League Master League.

### Key Takeaways for Auction Buyers:
- High Level 50 accounts with **Legacy Palkia (Spacial Rend)** and **Dialga (Roar of Time)** command premium valuations in live auctions.
- Check account medals for *Rising Star* and *Battle Legend* to ensure maximum resource allocation.
`,
  },
  {
    articleId: "v3-marketplace-security-realtime-bidding",
    title: "Platform Update v3.2: Sub-Millisecond WebSocket Bidding & Escrow Protection",
    excerpt: "We have released our biggest update yet featuring ultra-fast websocket bidding, live multi-currency conversion, and automated seller escrow verification.",
    category: "Updates",
    author: {
      name: "Tech Operations",
      role: "Platform Lead Engineer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    tags: ["Platform Update", "Security", "Live Bidding", "Escrow", "WebSockets"],
    publishedAt: "2026-07-12T14:30:00.000Z",
    readTime: "4 min read",
    featured: false,
    views: 980,
    seoTitle: "v3.2 Platform Update: Real-Time Bidding & Account Escrow",
    seoDescription: "Discover what is new in Platform Update v3.2: instant WebSocket bidding, multi-currency display, and automated account escrow safety.",
    seoKeywords: ["Pokemon GO Auctions", "Realtime Bidding", "Account Safety", "Multi-currency", "Escrow Protection"],
    content: `
# Platform Update v3.2: Enhanced Bidding & Security

We are thrilled to unveil **Platform Update v3.2**, engineered specifically to deliver a zero-latency bidding environment and bulletproof buyer protection.

---

## ⚡ What's New in Version 3.2?

### 1. Sub-Millisecond WebSocket Engine
Our live auction rooms now push bid updates across all global edge nodes within **15ms**. Say goodbye to last-second sniper lag:
- Dynamic live price ticks without page refreshes.
- Instant visual outbid notifications.
- Automatic anti-snipe time extension (adds 60 seconds if a bid is placed in the final 30 seconds).

### 2. Multi-Currency Live Conversion
View prices dynamically in your local currency: **USD ($)**, **EUR (€)**, **INR (₹)**, **GBP (£)**, or **JPY (¥)** with real-time rate updates provided directly by institutional exchange feeds.

---

## 🔒 Automated Seller Escrow Safeguards

Your security is our highest priority. All accounts listed on our auction house undergo automated pre-auction validation:
- **Instant Credential Verification**: Email and binding verification.
- **Medal & Stardust Audit**: Automated verification of Level 80/50 status and Stardust counts.
- **100% Money-Back Escrow**: Funds are safely held in escrow until buyer verification completes successfully.
`,
  },
  {
    articleId: "how-to-evaluate-high-iv-shadow-legendaries-auction-guide",
    title: "How to Evaluate High-IV & Shadow Legendary Accounts Before Bidding",
    excerpt: "Learn how expert buyers analyze account value based on Legacy movesets, Stardust reserves, Level 50 Shadow Legendaries, and medal history.",
    category: "Marketplace",
    author: {
      name: "Master Trainer Alex",
      role: "Auction Valuations Specialist",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    tags: ["Account Buying", "Valuation Guide", "Shadow Legendaries", "Stardust", "PvP"],
    publishedAt: "2026-07-08T09:15:00.000Z",
    readTime: "5 min read",
    featured: false,
    views: 2150,
    seoTitle: "Account Valuation Guide: Evaluating Shadow Legendaries & High-IV Accounts",
    seoDescription: "Learn how to value Pokémon GO accounts before bidding in auctions. Covers Stardust value, Shadow Legendaries, Legacy moves, and trainer level impact.",
    seoKeywords: ["Evaluate Pokemon GO Account", "Account Value Calculator", "Shadow Legendary Valuation", "Stardust Value", "Pokemon GO Auction Guide"],
    content: `
# How to Evaluate Pokémon GO Accounts Like a Pro

Navigating account auctions requires knowing exactly where true account value lies. Beyond simple Trainer Level (e.g. Level 40 or Level 50), high-tier buyers inspect critical secondary assets.

---

## 📊 Key Account Valuation Metrics

| Metric | Importance | Target Benchmark | Value Multiplier |
| :--- | :--- | :--- | :--- |
| **Stardust Reserve** | High | 5M+ Stardust | +15% to +30% |
| **Shadow 100% IV (Shando)** | Ultra High | 3+ Level 50 Shadow Hundos | +40% |
| **Shiny Mythicals** | Extremely High | Shiny Mew / Shiny Jirachi | +50% |
| **Elite Fast/Charge TMs** | Medium | 10+ E-TMs available | +10% |

---

## 🎒 Key Items Checklist Before Placing a Bid

1. **Change Nickname Available**: Verify if the account allows a free trainer name change.
2. **Clean Linkage**: Ensure Google / PTC / Facebook logins can be fully unlinked and bound to your personal email.
3. **Bag & Storage Upgrades**: Check Item Bag Capacity (2,000+) and Pokémon Storage (3,000+) as these upgrades save hundreds in PokéCoins!

> 🏆 **Pro-Tip**: Accounts with active **Level 50 Primal Kyogre/Groudon** paired with 10M+ Stardust yield the highest resale liquidity on the market today.
`,
  },
  {
    articleId: "account-safety-two-factor-authentication-best-practices",
    title: "Account Recovery Security Protocols: Safeguarding Trainer Credentials",
    excerpt: "A detailed breakdown of how our recovery network guarantees 100% security during account handovers, 2FA setup, and recovery processes.",
    category: "Security",
    author: {
      name: "Security Lead Sarah",
      role: "Cybersecurity Analyst",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    coverImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80",
    tags: ["Security", "Account Recovery", "Safety Protocols", "2FA", "Buyer Protection"],
    publishedAt: "2026-07-02T16:45:00.000Z",
    readTime: "4 min read",
    featured: false,
    views: 840,
    seoTitle: "Account Recovery Security Protocols & Buyer Protection Guide",
    seoDescription: "Read our comprehensive account recovery security guidelines. Learn how 2FA, password transfers, and escrow security protect buyers and sellers.",
    seoKeywords: ["Account Safety", "Pokemon GO Recovery", "2FA Protection", "Escrow Security", "Trainer Account Transfer"],
    content: `
# Account Recovery & Security Best Practices

When purchasing or recovering a Pokémon GO account, adhering to strict security protocols ensures your investment remains 100% safe for life.

---

## 🛡️ Step-by-Step Account Security Workflow

Once an auction closes or a recovery order completes, follow this mandatory 4-step security checklist:

1. **Immediate Password Reset**:
   - Change the account login password immediately upon receiving transfer credentials.
   - Use a strong, unique 16+ character password combining numbers, symbols, and mixed cases.

2. **Enable 2-Factor Authentication (2FA)**:
   - Attach an Authenticator App (Google Authenticator, Authy, or 1Password) to the associated email and Niantic ID.
   - Generate and download single-use **Backup Recovery Codes** and store them offline.

3. **Revoke Unused Third-Party Access**:
   - Navigate to Google Account Security / Facebook Apps and remove any unknown linked applications.

4. **Verify Recovery Email & Phone Number**:
   - Update secondary recovery emails and phone numbers to your own trusted devices.

---

## 🤝 Our Guarantee

All orders processed through our official portal come with **Lifetime Recovery Protection** and **Verified Escrow Safeguards**. If any login issue arises, our dedicated support team resolves tickets in under 15 minutes!
`,
  },
  {
    articleId: "community-day-classic-exclusive-moves-tier-list-2026",
    title: "2026 Meta Report: Top 10 Must-Have Exclusive Movesets in Pokémon GO",
    excerpt: "An in-depth analysis of the current Master League and Great League meta, highlighting which Legacy moves yield the highest win rates.",
    category: "Community",
    author: {
      name: "PvP Strategist Kai",
      role: "Competitive Meta Analyst",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    },
    coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80",
    tags: ["Meta Report", "PvP Tier List", "Exclusive Moves", "Great League", "Master League"],
    publishedAt: "2026-06-25T11:20:00.000Z",
    readTime: "7 min read",
    featured: false,
    views: 1890,
    seoTitle: "2026 Meta Report: Top 10 Exclusive Legacy Movesets in Pokémon GO",
    seoDescription: "Discover the top 10 exclusive Legacy movesets in Pokémon GO for PvP Great League, Ultra League, and Master League in 2026.",
    seoKeywords: ["Pokemon GO Meta Report 2026", "Top Legacy Moves", "Exclusive Movesets", "PvP Tier List", "Master League Best Pokemon"],
    content: `
# 2026 Meta Report: Top 10 Must-Have Exclusive Movesets

Competitive Pokémon GO PvP requires having access to critical **Legacy and Event-Exclusive moves**. Missing a single signature move can turn a winning matchup into a total defeat.

---

## 🏆 Top 5 Master League Exclusive Moves

1. **Palkia (Origin)** — *Spacial Rend*:
   - Unmatched Dragon-type energy efficiency. Allows Palkia to pressure shields faster than any competitor.

2. **Dialga (Origin)** — *Roar of Time*:
   - Devastating Dragon-type Charge move capable of KO'ing neutral threats even through shield chip.

3. **Groudon** — *Precipice Blades*:
   - Massive Ground-type damage that cleanly OHKOs Steel types like Metagross and Dialga.

4. **Kyogre** — *Origin Pulse*:
   - Unresisted Hydro Cannon upgrade that forces immediate shield usage across the board.

5. **Mewtwo** — *Psystrike*:
   - The gold standard of PvP Charge moves: low energy cost, extreme STAB damage.

---

## 🎯 Great League & Ultra League Essentials

- **Swampert**: *Hydro Cannon* (Mandatory starter move)
- **Charizard**: *Blast Burn* + *Wing Attack* (Double Legacy setup)
- **Venusaur**: *Frenzy Plant* (Essential Grass closer)
- **Walrein**: *Powder Snow* + *Icicle Spear* (Dominant Ice lead)

Looking to acquire a ready-to-compete Legend rank account? Browse our live auctions filtering for **Legacy Move Collections**!
`,
  },
];

// Seed initial articles into MongoDB once if DB has no seed marker
async function ensureNewsSeeded() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) return;
    const configCol = db.collection("system_configs");
    const seededDoc = await configCol.findOne({ key: "news_articles_seeded" });

    if (!seededDoc) {
      const count = await NewsArticle.countDocuments();
      if (count === 0) {
        console.log("[ensureNewsSeeded] Seeding initial articles into MongoDB...");
        await NewsArticle.insertMany(
          SEED_ARTICLES.map((a) => ({
            ...a,
            slug: a.articleId,
            publishedAt: new Date(a.publishedAt),
          }))
        );
      }
      await configCol.updateOne(
        { key: "news_articles_seeded" },
        { $set: { key: "news_articles_seeded", value: true, seededAt: new Date() } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error("[ensureNewsSeeded] Seeding error:", err);
  }
}

export async function getAllNewsArticles(category?: string, query?: string): Promise<ArticleData[]> {
  try {
    await connectDB();
    await ensureNewsSeeded();

    const filter: any = {};
    if (category && category !== "All") {
      filter.category = category;
    }
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { excerpt: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ];
    }

    const docs = await NewsArticle.find(filter).sort({ publishedAt: -1 }).lean();

    return docs.map((doc: any) => ({
      articleId: doc.articleId || String(doc._id),
      title: doc.title,
      excerpt: doc.excerpt,
      content: doc.content,
      category: doc.category,
      author: doc.author,
      coverImage: doc.coverImage,
      tags: doc.tags || [],
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : new Date().toISOString(),
      readTime: doc.readTime || "5 min read",
      featured: Boolean(doc.featured),
      views: doc.views || 0,
      seoTitle: doc.seoTitle,
      seoDescription: doc.seoDescription,
      seoKeywords: doc.seoKeywords || [],
    }));
  } catch (error) {
    console.error("[getAllNewsArticles] Error fetching from DB:", error);
    return [];
  }
}

export async function getNewsArticleById(idOrSlug: string): Promise<ArticleData | null> {
  if (!idOrSlug) return null;
  const decodedId = decodeURIComponent(idOrSlug).trim();

  try {
    await connectDB();
    await ensureNewsSeeded();

    const doc: any = await NewsArticle.findOne({
      $or: [{ articleId: decodedId }, { slug: decodedId }],
    }).lean();

    if (doc) {
      return {
        articleId: doc.articleId || String(doc._id),
        title: doc.title,
        excerpt: doc.excerpt,
        content: doc.content,
        category: doc.category,
        author: doc.author,
        coverImage: doc.coverImage,
        tags: doc.tags || [],
        publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : new Date().toISOString(),
        readTime: doc.readTime || "5 min read",
        featured: Boolean(doc.featured),
        views: (doc.views || 0) + 1,
        seoTitle: doc.seoTitle,
        seoDescription: doc.seoDescription,
        seoKeywords: doc.seoKeywords || [],
      };
    }
  } catch (error) {
    console.error("[getNewsArticleById] Error fetching from DB:", error);
  }

  return null;
}

export async function getRelatedNewsArticles(
  currentId: string,
  category: string,
  limit: number = 3
): Promise<ArticleData[]> {
  const all = await getAllNewsArticles();
  const filtered = all.filter(
    (a) => a.articleId.toLowerCase() !== currentId.toLowerCase()
  );
  const sameCategory = filtered.filter((a) => a.category === category);
  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }
  return filtered.slice(0, limit);
}

export async function incrementArticleViews(articleId: string) {
  try {
    await connectDB();
    await NewsArticle.updateOne({ articleId }, { $inc: { views: 1 } });
  } catch (err) {
    // Ignore view increment errors silently
  }
}

export async function createNewsArticle(data: ArticleInputData): Promise<{ success: boolean; error?: string; articleId?: string }> {
  try {
    await connectDB();
    await ensureNewsSeeded();

    if (!data.title || !data.excerpt || !data.content || !data.coverImage) {
      return { success: false, error: "Please fill in all required fields (Title, Excerpt, Content, Cover Image)." };
    }

    const cleanId = data.articleId.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    
    // Check if articleId exists
    const existing = await NewsArticle.findOne({
      $or: [{ articleId: cleanId }, { slug: cleanId }],
    });

    if (existing) {
      return { success: false, error: `Article ID / Slug "${cleanId}" already exists. Please choose a unique ID.` };
    }

    // If featured, un-feature other articles
    if (data.featured) {
      await NewsArticle.updateMany({}, { featured: false });
    }

    const newDoc = new NewsArticle({
      articleId: cleanId,
      slug: cleanId,
      title: data.title.trim(),
      excerpt: data.excerpt.trim(),
      content: data.content.trim(),
      category: data.category || "Updates",
      author: {
        name: data.authorName?.trim() || "Pokémon GO Services Team",
        role: data.authorRole?.trim() || "Official Announcement",
        avatar: data.authorAvatar?.trim() || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      },
      coverImage: data.coverImage.trim(),
      tags: data.tags || [],
      publishedAt: new Date(),
      readTime: data.readTime || "5 min read",
      featured: Boolean(data.featured),
      views: 0,
      seoTitle: data.seoTitle?.trim() || data.title.trim(),
      seoDescription: data.seoDescription?.trim() || data.excerpt.trim(),
      seoKeywords: data.seoKeywords || data.tags || [],
    });

    await newDoc.save();
    return { success: true, articleId: cleanId };
  } catch (err: any) {
    console.error("[createNewsArticle] Error:", err);
    return { success: false, error: err.message || "Failed to create news article." };
  }
}

export async function updateNewsArticle(id: string, data: Partial<ArticleInputData>): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    await ensureNewsSeeded();

    const updateData: any = {};
    if (data.title) updateData.title = data.title.trim();
    if (data.excerpt) updateData.excerpt = data.excerpt.trim();
    if (data.content) updateData.content = data.content.trim();
    if (data.category) updateData.category = data.category;
    if (data.coverImage) updateData.coverImage = data.coverImage.trim();
    if (data.readTime) updateData.readTime = data.readTime.trim();
    if (data.tags) updateData.tags = data.tags;
    if (typeof data.featured === "boolean") {
      updateData.featured = data.featured;
      if (data.featured) {
        await NewsArticle.updateMany({ articleId: { $ne: id } }, { featured: false });
      }
    }
    if (data.authorName || data.authorRole || data.authorAvatar) {
      updateData["author.name"] = data.authorName;
      updateData["author.role"] = data.authorRole;
      updateData["author.avatar"] = data.authorAvatar;
    }
    if (data.seoTitle) updateData.seoTitle = data.seoTitle;
    if (data.seoDescription) updateData.seoDescription = data.seoDescription;
    if (data.seoKeywords) updateData.seoKeywords = data.seoKeywords;

    await NewsArticle.updateOne({ articleId: id }, { $set: updateData });
    return { success: true };
  } catch (err: any) {
    console.error("[updateNewsArticle] Error:", err);
    return { success: false, error: err.message || "Failed to update article." };
  }
}

export async function deleteNewsArticle(articleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    await ensureNewsSeeded();

    const cleanId = decodeURIComponent(articleId).trim();

    // Fetch the article first to get the image URL
    const article = await NewsArticle.findOne({
      $or: [{ articleId: cleanId }, { slug: cleanId }],
    });

    if (article && article.coverImage) {
      try {
        const { deleteFromCloudinary } = await import("@/lib/cloudinary");
        await deleteFromCloudinary(article.coverImage);
        console.log(`[deleteNewsArticle] Successfully deleted image from Cloudinary for articleId: ${cleanId}`);
      } catch (imgErr) {
        console.error("[deleteNewsArticle] Failed to delete image from Cloudinary:", imgErr);
        // Continue with database deletion even if image deletion fails
      }
    }

    const res = await NewsArticle.deleteOne({
      $or: [{ articleId: cleanId }, { slug: cleanId }],
    });

    console.log(`[deleteNewsArticle] Successfully deleted ${res.deletedCount} document(s) for articleId: ${cleanId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[deleteNewsArticle] Error:", err);
    return { success: false, error: err.message || "Failed to delete article." };
  }
}

export async function uploadNewsImageAction(base64Data: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { uploadToCloudinary } = await import("@/lib/cloudinary");
    const url = await uploadToCloudinary(base64Data);
    return { success: true, url };
  } catch (err: any) {
    console.error("[uploadNewsImageAction] Error:", err);
    return { success: false, error: err.message || "Failed to upload cover image." };
  }
}

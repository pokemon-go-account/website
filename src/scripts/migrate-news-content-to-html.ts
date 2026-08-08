import path from "path";
import fs from "fs";
import { isLikelyHtml, convertLegacyContentToHtml } from "@/lib/legacy-content";

// Load .env.local if MONGODB_URI is not set before importing db & models
if (!process.env.MONGODB_URI) {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[match[1]] = value;
      }
    });
  }
}

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || process.env.DRY_RUN === "true";

async function migrateNewsContentToHtml() {
  const { default: connectDB } = await import("@/lib/db");
  const { default: NewsArticle } = await import("@/models/NewsArticle");

  await connectDB();

  console.log(`🔍 Scanning NewsArticle documents for legacy content migration...`);
  if (isDryRun) {
    console.log(`⚠️  Running in DRY-RUN mode. No database modifications will be performed.\n`);
  }

  const articles = await NewsArticle.find({});
  let totalScanned = articles.length;
  let converted = 0;
  let skipped = 0;
  let errors = 0;

  for (const article of articles) {
    try {
      const rawContent = article.content || "";
      if (isLikelyHtml(rawContent)) {
        skipped++;
        continue;
      }

      const htmlContent = convertLegacyContentToHtml(rawContent);

      if (isDryRun) {
        console.log(`[DRY-RUN] Article "${article.title}" (${article.articleId}) WOULD be converted:`);
        console.log(`  Before: ${rawContent.slice(0, 80).replace(/\n/g, " ")}...`);
        console.log(`  After:  ${htmlContent.slice(0, 80).replace(/\n/g, " ")}...\n`);
      } else {
        await NewsArticle.updateOne(
          { _id: article._id },
          { $set: { content: htmlContent } }
        );
        console.log(`✅ Converted Article "${article.title}" (${article.articleId}) to HTML.`);
      }

      converted++;
    } catch (err: any) {
      errors++;
      console.error(`❌ Error converting Article "${article.title}" (${article.articleId}):`, err.message || err);
    }
  }

  console.log("\n==========================================");
  console.log("📊 NEWS CONTENT HTML MIGRATION SUMMARY");
  console.log("==========================================");
  console.log(`Total Articles Scanned:  ${totalScanned}`);
  console.log(`Converted to HTML:       ${converted}`);
  console.log(`Skipped (Already HTML):  ${skipped}`);
  console.log(`Errors Encountered:      ${errors}`);
  if (isDryRun) {
    console.log(`Mode:                    DRY-RUN (Simulated)`);
  } else {
    console.log(`Mode:                    LIVE (Database Updated)`);
  }
  console.log("==========================================\n");

  process.exit(0);
}

migrateNewsContentToHtml().catch((err) => {
  console.error("❌ Migration failed with fatal error:", err);
  process.exit(1);
});

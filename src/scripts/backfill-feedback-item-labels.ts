import fs from "fs";
import path from "path";

if (!process.env.MONGODB_URI) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      });
      console.log("Loaded .env.local configuration.");
    }
  } catch (error) {
    console.error("Failed to load .env.local manually:", error);
  }
}

import { inferPurchasedItemLabel } from "../lib/infer-purchased-label";



async function run() {
  const connectDB = (await import("../lib/db")).default;
  const Feedback = (await import("../models/Feedback")).default;

  await connectDB();

  // Process ALL feedbacks that are missing or have an empty purchasedItemLabel
  // (regardless of whether they have an orderId — the page prefers order items
  //  when available, but the label is a fallback shown when the order can't be populated)
  console.log("Fetching all Feedback documents to update purchasedItemLabel...");
  const feedbacks = await Feedback.find({});

  console.log(`Found ${feedbacks.length} Feedback docs needing a label.`);
  let updatedCount = 0;

  for (const doc of feedbacks) {
    const label = inferPurchasedItemLabel(doc.comment, doc.username);
    doc.purchasedItemLabel = label;
    await doc.save();
    updatedCount++;
    console.log(`[REVIEW ${updatedCount}/${feedbacks.length}] Username: ${doc.username} | Rating: ${doc.rating}★ | Label: "${label}" | Comment: "${doc.comment.substring(0, 40)}..."`);
  }

  console.log(`✅ Backfilled purchasedItemLabel for ${updatedCount} feedback records successfully.`);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith("backfill-feedback-item-labels.ts")) {
  run().catch((err) => {
    console.error("Backfill script error:", err);
    process.exit(1);
  });
}

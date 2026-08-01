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

export function inferPurchasedItemLabel(comment: string): string {
  const c = comment.toLowerCase();
  if (c.includes("recover") || c.includes("hacked") || c.includes("unbanned") || c.includes("locked") || c.includes("account back")) {
    return "Pokémon GO Account Recovery Service";
  }
  if (c.includes("stardust")) {
    return "Stardust Boost Pack";
  }
  if (c.includes("level 45") || c.includes("lvl 45") || c.includes("level 50") || c.includes("lvl 50") || c.includes("level 40")) {
    return "Level 45+ Master Account";
  }
  if (c.includes("pokecoin") || c.includes("coin")) {
    return "14,500 PokeCoins Top-Up Pack";
  }
  if (c.includes("charizard")) {
    return "Shiny Charizard Account";
  }
  if (c.includes("mewtwo") || c.includes("armored")) {
    return "Armored Mewtwo Account";
  }
  if (c.includes("rayquaza")) {
    return "Shiny Rayquaza Account";
  }
  if (c.includes("kyogre") || c.includes("groudon")) {
    return "Primal Kyogre & Groudon Pack";
  }
  if (c.includes("dialga") || c.includes("palkia") || c.includes("giratina") || c.includes("arceus")) {
    return "Legendary Origin Forme Account";
  }
  if (c.includes("shiny") || c.includes("shonies")) {
    return "Shiny Collector Account";
  }
  if (c.includes("telegram")) {
    return "Telegram Custom Catch & Trade";
  }
  if (c.includes("raid") || c.includes("gym")) {
    return "Raid Battle Pass Bundle";
  }
  if (c.includes("pokedex")) {
    return "Pokedex Completion Service";
  }
  return "Pokémon GO Trainer Account";
}

async function run() {
  const connectDB = (await import("../lib/db")).default;
  const Feedback = (await import("../models/Feedback")).default;

  await connectDB();

  console.log("Fetching orderId-less Feedback documents...");
  const feedbacks = await Feedback.find({
    $or: [{ orderId: { $exists: false } }, { orderId: null }],
  });

  console.log(`Found ${feedbacks.length} Feedback docs without orderId.`);
  let updatedCount = 0;

  for (const doc of feedbacks) {
    const label = inferPurchasedItemLabel(doc.comment);
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

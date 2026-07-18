import fs from "fs";
import path from "path";

// Load .env.local manually if running outside of Next.js dev server environment
// This MUST run before any DB/model modules are loaded
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

const mockReviews = [
  { username: "TrainerAsh99", rating: 5, comment: "Fast and secure. Account recovered within 1 hour!" },
  { username: "MysticPro", rating: 5, comment: "Highly recommend these guys. Super fast responses." },
  { username: "ShinyCollector", rating: 5, comment: "Got my account back after it was hacked. Support was awesome." },
  { username: "ValorGrinder", rating: 4, comment: "Decent price and got it done. Took a bit longer but satisfied." },
  { username: "InstinctPvP", rating: 5, comment: "Legit site. Thought my 2016 account was gone forever. Thanks!" },
  { username: "ShadowHunter", rating: 5, comment: "A+ service. Very professional team." },
  { username: "CatchEmAll9", rating: 5, comment: "Absolutely amazing. Quick process and very secure." },
  { username: "Lvl50Dreams", rating: 4, comment: "Process is simple, they keep you updated on Telegram." },
  { username: "VaporeonLover", rating: 5, comment: "Lifesavers. Lost my login details and they got it sorted." },
  { username: "Dragonite99", rating: 5, comment: "Fast, secure, and friendly. Recommended!" },
  { username: "PikaPika2026", rating: 5, comment: "Great customer service. Kept me updated throughout." },
  { username: "MewtwoBoss", rating: 5, comment: "10/10 service. Well worth the money." },
  { username: "GengarGhost", rating: 5, comment: "Super easy. Account recovered in under 2 hours." },
  { username: "EeveeFan", rating: 4, comment: "Took slightly longer than expected but got my account back intact." },
  { username: "RaidMaster", rating: 5, comment: "Trustworthy and reliable. Will use again if needed." },
  { username: "GymLeaderBlue", rating: 5, comment: "Perfect service. Quick and secure." },
  { username: "StardustRich", rating: 5, comment: "Saved my level 45 account. Worth every penny." },
  { username: "PokedexComplete", rating: 4, comment: "Good service, very helpful support." },
  { username: "NianticHater", rating: 5, comment: "Got unbanned after false flag! Amazing service!" },
  { username: "SnorlaxSleep", rating: 5, comment: "So glad I found this. Fast recovery." },
  { username: "CharizardFire", rating: 5, comment: "Best recovery service out there. Simple as that." },
  { username: "BlastoiseWater", rating: 5, comment: "Excellent communication and quick results." },
  { username: "VenusaurLeaf", rating: 5, comment: "Top notch. Highly recommended for any Trainer." },
  { username: "MachampPunch", rating: 4, comment: "Quick recovery, support on Telegram was super helpful." },
  { username: "AlakazamMind", rating: 5, comment: "They know what they're doing. Very professional." },
  { username: "LaprasSurf", rating: 5, comment: "Got my main account back. Extremely satisfied." },
  { username: "GyaradosRage", rating: 5, comment: "Fast turnaround. Highly recommended." },
  { username: "TyranitarRock", rating: 5, comment: "Great experience. 100% secure." },
  { username: "LugiasWind", rating: 4, comment: "Good service, took about 3 hours." },
  { username: "HoOhRainbow", rating: 5, comment: "Absolutely brilliant! Recovered my account safely." },
  { username: "CelebiTime", rating: 5, comment: "Amazing support. Highly recommended!" },
  { username: "KyogreRain", rating: 5, comment: "Smooth transaction. My account is back!" },
  { username: "GroudonDrought", rating: 5, comment: "Very professional. Kept me updated." },
  { username: "RayquazaSky", rating: 4, comment: "Safe and reliable. Got my account back." },
  { username: "JirachiWish", rating: 5, comment: "My wish came true! Got my account back!" },
  { username: "DeoxysSpace", rating: 5, comment: "Fastest service ever. Thanks a lot!" },
  { username: "DialgaTime", rating: 5, comment: "Perfect, no issues at all." },
  { username: "PalkiaSpace", rating: 5, comment: "Very secure. Highly recommend." },
  { username: "GiratinaGhost", rating: 4, comment: "Took a couple of hours but they got it done." },
  { username: "DarkraiNight", rating: 5, comment: "Great customer service. Extremely helpful." },
  { username: "ArceusGod", rating: 5, comment: "Absolutely perfect. Saved my main account." },
  { username: "VictiniVictory", rating: 5, comment: "A huge win! Account recovered instantly!" },
  { username: "ReshiramTruth", rating: 5, comment: "Legit and honest team. Thank you." },
  { username: "ZekromIdeals", rating: 4, comment: "Reliable service. Satisfied customer." },
  { username: "KyuremIce", rating: 5, comment: "Professional and quick. Highly recommended." },
  { username: "XerneasLife", rating: 5, comment: "Amazing results. Got it back within an hour." },
  { username: "YveltalDestruction", rating: 5, comment: "Saved my old account. Awesome job." },
  { username: "ZygardeOrder", rating: 5, comment: "Safe, secure, and fast. Excellent service." },
  { username: "DiancieJewel", rating: 4, comment: "Very helpful support team." },
  { username: "HoopaRing", rating: 5, comment: "Recovered my locked account! Super happy." },
  { username: "VolcanionSteam", rating: 5, comment: "Great job, very quick recovery." },
  { username: "SolgaleoSun", rating: 5, comment: "Outstanding service. Highly professional." },
  { username: "LunalaMoon", rating: 5, comment: "Quick and safe. Couldn't ask for more." },
  { username: "NecrozmaLight", rating: 4, comment: "Took a bit of time but success in the end." },
  { username: "ZacianSword", rating: 5, comment: "Flawless process. Recommended to all." },
  { username: "ZamazentaShield", rating: 5, comment: "Kept my account safe. 10/10." },
  { username: "EternatusCore", rating: 5, comment: "Awesome experience, very fast." },
  { username: "KubfuFight", rating: 5, comment: "Great support. Fast response times." },
  { username: "UrshifuStrike", rating: 4, comment: "Reliable service, got the job done." },
  { username: "CalyrexCrown", rating: 5, comment: "Very smooth process. Highly satisfied." },
  { username: "RegielekiBolt", rating: 5, comment: "Extremely fast. Done in 30 mins!" },
  { username: "RegidragoTooth", rating: 5, comment: "Excellent service. Got my account back safe." },
  { username: "MelmetalMetal", rating: 5, comment: "Professional recovery. Best in the business." }
];

async function seed() {
  console.log("Dynamically importing modules...");
  const connectDB = (await import("../lib/db")).default;
  const Category = (await import("../models/Category")).default;
  const Product = (await import("../models/Product")).default;
  const Feedback = (await import("../models/Feedback")).default;

  console.log("Connecting to database...");
  await connectDB();

  // 1. Seed Category
  console.log("Checking recovery services category...");
  let category = await Category.findOne({ slug: "recovery-services" });
  if (!category) {
    category = await Category.create({
      name: "Recovery Services",
      slug: "recovery-services"
    });
    console.log("Created category: Recovery Services");
  } else {
    console.log("Category 'Recovery Services' already exists.");
  }

  // 2. Seed Product
  console.log("Checking recovery service product...");
  let product = await Product.findOne({ name: "Premium Pokémon GO Account Recovery Service" });
  if (!product) {
    product = await Product.create({
      name: "Premium Pokémon GO Account Recovery Service",
      description: "Professional recovery and retrieval service for lost, banned, or compromised Pokémon GO accounts. 100% secure, manual review, and high success rate.",
      price: 49.99,
      categoryId: category._id,
      imageUrl: "/recovery-service.png"
    });
    console.log("Created product: Premium Pokémon GO Account Recovery Service");
  } else {
    console.log("Product 'Premium Pokémon GO Account Recovery Service' already exists.");
  }

  // 3. Seed Feedbacks
  console.log("Checking existing feedbacks...");
  const feedbackCount = await Feedback.countDocuments();
  if (feedbackCount === 0) {
    console.log(`Inserting ${mockReviews.length} mock feedbacks with realistic dates...`);
    const startDate = new Date("2026-05-06T08:00:00.000Z").getTime();
    const endDate = new Date("2026-07-06T20:00:00.000Z").getTime();
    const reviewsWithDates = mockReviews.map((r) => ({
      ...r,
      createdAt: new Date(startDate + Math.random() * (endDate - startDate)),
    }));
    await Feedback.insertMany(reviewsWithDates);
    console.log("✅ Seeded mock feedbacks successfully!");
  } else {
    console.log(`Feedback database already has ${feedbackCount} entries. Skipping seeding.`);
  }

  console.log("🎉 Database seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

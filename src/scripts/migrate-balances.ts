import fs from "fs";
import path from "path";

// Load .env.local manually if running outside of Next.js dev server environment
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
      console.log("Loaded .env.local configuration manually.");
    }
  } catch (error) {
    console.error("Failed to load .env.local manually:", error);
  }
}

async function migrateBalances() {
  console.log("Dynamically importing modules...");
  const connectDB = (await import("../lib/db")).default;
  const User = (await import("../models/User")).default;

  console.log('Connecting to database...');
  await connectDB();

  console.log('Running balance migration query...');
  const result = await User.updateMany(
    { walletBalance: -2.5 },
    { $set: { walletBalance: 2.5 } }
  );

  console.log(`✅ Migration complete: ${result.modifiedCount} user(s) updated from -2.5 → +2.5`);
  process.exit(0);
}

migrateBalances().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

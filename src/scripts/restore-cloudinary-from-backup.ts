import fs from "fs";
import path from "path";
import { downloadBackup } from "../lib/r2-backup";
import { uploadToCloudinary } from "../lib/cloudinary";

const args = process.argv.slice(2);
const collectionArg = args.find((a) => a.startsWith("--collection="))?.split("=")[1];

const LOG_FILE = path.resolve(process.cwd(), "migration-log.jsonl");

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

interface LogEntry {
  oldUrl: string;
  newUrl?: string;
  backupKey: string;
  collection: string;
  documentId: string;
  field: string;
  timestamp: string;
  status: string;
}

export async function restoreSingleEntry(
  entry: LogEntry,
  models: Record<string, any>
): Promise<{ success: boolean; restoredUrl?: string; error?: string }> {
  const Model = models[entry.collection];
  if (!Model) {
    return { success: false, error: `Model for collection ${entry.collection} not found.` };
  }

  try {
    // 1. Download original bytes back from R2 via authenticated S3 GET
    const bytes = await downloadBackup(entry.backupKey);

    // 2. Re-upload bytes to Cloudinary
    const base64Data = `data:image/png;base64,${bytes.toString("base64")}`;
    const restoredCloudinaryUrl = await uploadToCloudinary(base64Data);

    // 3. Rewrite Mongo document field back to restored Cloudinary URL
    const doc = await Model.findById(entry.documentId);
    if (!doc) {
      return { success: false, error: `Document ${entry.documentId} not found in ${entry.collection}.` };
    }

    const currentFieldValue = doc[entry.field];
    if (Array.isArray(currentFieldValue)) {
      // Find matching item or index in array
      const idx = currentFieldValue.findIndex(
        (val: string) => val === entry.newUrl || val === entry.oldUrl
      );
      if (idx !== -1) {
        currentFieldValue[idx] = restoredCloudinaryUrl;
      } else {
        currentFieldValue.push(restoredCloudinaryUrl);
      }
      doc[entry.field] = currentFieldValue;
    } else {
      doc[entry.field] = restoredCloudinaryUrl;
    }

    await doc.save();
    return { success: true, restoredUrl: restoredCloudinaryUrl };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

async function run() {
  const { default: connectDB } = await import("../lib/db");
  await connectDB();

  const Product = (await import("../models/Product")).default;
  const Listing = (await import("../models/Listing")).default;
  const Category = (await import("../models/Category")).default;
  const NewsArticle = (await import("../models/NewsArticle")).default;
  const RecoveryRequest = (await import("../models/RecoveryRequest")).default;
  const Payment = (await import("../models/Payment")).default;
  const CryptoPayment = (await import("../models/CryptoPayment")).default;
  const PaypalPayment = (await import("../models/PaypalPayment")).default;
  const WisePayment = (await import("../models/WisePayment")).default;

  const models: Record<string, any> = {
    Product,
    Listing,
    Category,
    NewsArticle,
    RecoveryRequest,
    Payment,
    CryptoPayment,
    PaypalPayment,
    WisePayment,
  };

  if (!fs.existsSync(LOG_FILE)) {
    console.log("No migration-log.jsonl file found. Nothing to restore.");
    process.exit(0);
  }

  const lines = fs.readFileSync(LOG_FILE, "utf-8").split("\n");
  const entries: LogEntry[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line) as LogEntry;
      if (entry.status === "COMPLETED" && entry.backupKey) {
        if (!collectionArg || entry.collection === collectionArg) {
          entries.push(entry);
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  console.log(`Found ${entries.length} completed migration entries to restore.`);
  let restored = 0;
  let failed = 0;

  for (const entry of entries) {
    console.log(`Restoring ${entry.collection} (${entry.documentId}) field ${entry.field}...`);
    const res = await restoreSingleEntry(entry, models);
    if (res.success) {
      restored++;
      entry.status = "ROLLED_BACK";
      console.log(`  ✅ Restored Cloudinary URL: ${res.restoredUrl}`);
    } else {
      failed++;
      console.error(`  ❌ Failed to restore: ${res.error}`);
    }
  }

  console.log("\n==========================================");
  console.log("🔄 RESTORE SUMMARY");
  console.log("==========================================");
  console.log(`Total Eligible Entries: ${entries.length}`);
  console.log(`Successfully Restored:  ${restored}`);
  console.log(`Failed Restores:        ${failed}`);
  console.log("==========================================\n");

  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith("restore-cloudinary-from-backup.ts")) {
  run().catch((err) => {
    console.error("Restore script error:", err);
    process.exit(1);
  });
}

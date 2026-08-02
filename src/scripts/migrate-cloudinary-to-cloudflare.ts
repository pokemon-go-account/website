import fs from "fs";
import path from "path";
import { uploadBackup, verifyBackup, downloadBackup } from "../lib/r2-backup";
import { uploadToImages } from "../lib/cloudflare-images";
import { deleteFromCloudinary, extractCloudinaryPublicId } from "../lib/cloudinary";

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isBackupOnly = args.includes("--backup-only");
const collectionArg = args.find((a) => a.startsWith("--collection="))?.split("=")[1];

const LOG_FILE = path.resolve(process.cwd(), "migration-log.jsonl");
const FAILURES_FILE = path.resolve(process.cwd(), "failures.jsonl");

// Sensitive collections requiring private R2 prefix
const SENSITIVE_COLLECTIONS = new Set([
  "Payment",
  "CryptoPayment",
  "PaypalPayment",
  "WisePayment",
  "RecoveryRequest",
]);

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

// Load completed migration entries for resume check
function getCompletedUrls(): Set<string> {
  const completed = new Set<string>();
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, "utf-8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.oldUrl && entry.status === "COMPLETED") {
          completed.add(`${entry.collection}:${entry.documentId}:${entry.field}:${entry.oldUrl}`);
        }
      } catch {
        // ignore parse error
      }
    }
  }
  return completed;
}

function appendLog(file: string, data: Record<string, any>) {
  fs.appendFileSync(file, JSON.stringify(data) + "\n");
}

export function buildR2Key(
  collectionName: string,
  documentId: string,
  fieldName: string,
  oldUrl: string
): string {
  const publicId = extractCloudinaryPublicId(oldUrl) || "asset";
  const cleanId = publicId.replace(/[^a-zA-Z0-9._-]/g, "_");
  const isPrivate = SENSITIVE_COLLECTIONS.has(collectionName);
  const prefix = isPrivate ? "private/mongo" : "mongo";
  return `${prefix}/${collectionName}/${documentId}/${fieldName}/${cleanId}.png`;
}

interface MigrationItem {
  collectionName: string;
  documentId: string;
  field: string;
  oldUrl: string;
  isArray: boolean;
  arrayIndex?: number;
  docRef: any;
}

async function processMigrationItem(
  item: MigrationItem,
  completedSet: Set<string>
): Promise<{ success: boolean; skipped: boolean; error?: string }> {
  const itemKey = `${item.collectionName}:${item.documentId}:${item.field}:${item.oldUrl}`;
  if (completedSet.has(itemKey)) {
    return { success: true, skipped: true };
  }

  const isPrivate = SENSITIVE_COLLECTIONS.has(item.collectionName);
  const backupKey = buildR2Key(
    item.collectionName,
    item.documentId,
    item.field,
    item.oldUrl
  );

  // Resume check via R2 direct HEAD
  const alreadyInR2 = await verifyBackup(backupKey, isPrivate);
  
  try {
    let imageBuffer: Buffer;

    if (alreadyInR2) {
      // If already backed up to R2, download from R2 directly for step 2
      imageBuffer = await downloadBackup(backupKey);
    } else {
      // 1. BACKUP FIRST: Download original image bytes from Cloudinary
      const res = await fetch(item.oldUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch original Cloudinary image (${res.statusText}): ${item.oldUrl}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);

      // PUT to R2 via uploadBackup()
      await uploadBackup(backupKey, imageBuffer, isPrivate);

      // Confirm with verifyBackup()
      const verified = await verifyBackup(backupKey, isPrivate);
      if (!verified) {
        throw new Error(`R2 backup verification failed for key: ${backupKey}`);
      }
    }

    if (isBackupOnly) {
      appendLog(LOG_FILE, {
        oldUrl: item.oldUrl,
        newUrl: null,
        backupKey,
        collection: item.collectionName,
        documentId: item.documentId,
        field: item.field,
        timestamp: new Date().toISOString(),
        status: "BACKUP_ONLY",
      });
      return { success: true, skipped: false };
    }

    // 2. Upload to Cloudflare Images
    const mimeType = "image/png";
    const base64Data = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    const newDeliveryUrl = await uploadToImages(base64Data);

    // Verify delivery URL resolves (HEAD request)
    if (newDeliveryUrl.startsWith("http")) {
      try {
        const checkRes = await fetch(newDeliveryUrl, { method: "HEAD" });
        if (checkRes.status >= 400 && checkRes.status !== 401) {
          console.warn(`Cloudflare delivery HEAD check returned status ${checkRes.status} for ${newDeliveryUrl}`);
        }
      } catch (headErr) {
        console.warn(`Cloudflare delivery HEAD check failed (continuing):`, headErr);
      }
    }

    if (isDryRun) {
      console.log(`[DRY-RUN] Would update ${item.collectionName} (${item.documentId}) field ${item.field} -> ${newDeliveryUrl}`);
      return { success: true, skipped: false };
    }

    // 3. Update corresponding field on the Mongo document
    if (item.isArray && typeof item.arrayIndex === "number") {
      const currentArray = item.docRef[item.field] || [];
      currentArray[item.arrayIndex] = newDeliveryUrl;
      item.docRef[item.field] = currentArray;
      await item.docRef.save();
    } else {
      item.docRef[item.field] = newDeliveryUrl;
      await item.docRef.save();
    }

    // 4. Delete original from Cloudinary ONLY after Mongo write is confirmed
    await deleteFromCloudinary(item.oldUrl);

    // 5. Append migration log entry
    appendLog(LOG_FILE, {
      oldUrl: item.oldUrl,
      newUrl: newDeliveryUrl,
      backupKey,
      collection: item.collectionName,
      documentId: item.documentId,
      field: item.field,
      timestamp: new Date().toISOString(),
      status: "COMPLETED",
    });

    completedSet.add(itemKey);
    return { success: true, skipped: false };
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    appendLog(FAILURES_FILE, {
      oldUrl: item.oldUrl,
      collection: item.collectionName,
      documentId: item.documentId,
      field: item.field,
      timestamp: new Date().toISOString(),
      error: errorMsg,
    });
    return { success: false, skipped: false, error: errorMsg };
  }
}

async function run() {
  const { default: connectDB } = await import("../lib/db");
  await connectDB();

  const completedSet = getCompletedUrls();

  const Product = (await import("../models/Product")).default;
  const Listing = (await import("../models/Listing")).default;
  const Category = (await import("../models/Category")).default;
  const NewsArticle = (await import("../models/NewsArticle")).default;
  const RecoveryRequest = (await import("../models/RecoveryRequest")).default;
  const Payment = (await import("../models/Payment")).default;
  const CryptoPayment = (await import("../models/CryptoPayment")).default;
  const PaypalPayment = (await import("../models/PaypalPayment")).default;
  const WisePayment = (await import("../models/WisePayment")).default;

  const itemsToMigrate: MigrationItem[] = [];

  const collections = [
    { name: "Product", model: Product },
    { name: "Listing", model: Listing },
    { name: "Category", model: Category },
    { name: "NewsArticle", model: NewsArticle },
    { name: "RecoveryRequest", model: RecoveryRequest },
    { name: "Payment", model: Payment },
    { name: "CryptoPayment", model: CryptoPayment },
    { name: "PaypalPayment", model: PaypalPayment },
    { name: "WisePayment", model: WisePayment },
  ];

  for (const col of collections) {
    if (collectionArg && col.name !== collectionArg) continue;

    console.log(`Scanning collection: ${col.name}...`);
    const docs = await (col.model as any).find({});

    for (const doc of docs) {
      const docObj = doc.toObject();
      for (const [key, value] of Object.entries(docObj)) {
        if (typeof value === "string" && value.includes("res.cloudinary.com")) {
          itemsToMigrate.push({
            collectionName: col.name,
            documentId: doc._id.toString(),
            field: key,
            oldUrl: value,
            isArray: false,
            docRef: doc,
          });
        } else if (Array.isArray(value)) {
          value.forEach((element: any, index: number) => {
            if (typeof element === "string" && element.includes("res.cloudinary.com")) {
              itemsToMigrate.push({
                collectionName: col.name,
                documentId: doc._id.toString(),
                field: key,
                oldUrl: element,
                isArray: true,
                arrayIndex: index,
                docRef: doc,
              });
            }
          });
        }
      }
    }
  }

  console.log(`\nFound ${itemsToMigrate.length} Cloudinary assets to process across scanned collections.`);
  if (isDryRun) console.log("Mode: DRY-RUN (No Mongo writes or Cloudinary deletions)");
  if (isBackupOnly) console.log("Mode: BACKUP-ONLY (R2 backup only)");

  let backedUp = 0;
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  // Process items in parallel batch cap (5 tasks at a time)
  const CONCURRENCY_CAP = 5;
  for (let i = 0; i < itemsToMigrate.length; i += CONCURRENCY_CAP) {
    const chunk = itemsToMigrate.slice(i, i + CONCURRENCY_CAP);
    const results = await Promise.all(
      chunk.map((item) => processMigrationItem(item, completedSet))
    );

    for (const res of results) {
      if (res.skipped) {
        skipped++;
      } else if (res.success) {
        backedUp++;
        if (!isBackupOnly && !isDryRun) migrated++;
      } else {
        failed++;
      }
    }
  }

  console.log("\n==========================================");
  console.log("📊 MIGRATION SUMMARY");
  console.log("==========================================");
  console.log(`Total Scanned:      ${itemsToMigrate.length}`);
  console.log(`Backed Up to R2:    ${backedUp}`);
  console.log(`Migrated:           ${migrated}`);
  console.log(`Skipped (Done):     ${skipped}`);
  console.log(`Failed:             ${failed}`);
  console.log("==========================================\n");

  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith("migrate-cloudinary-to-cloudflare.ts")) {
  run().catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
}

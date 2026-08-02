import fs from "fs";
import path from "path";
import { uploadBackup, verifyBackup, downloadBackup } from "../lib/r2-backup";
import { uploadToImages } from "../lib/cloudflare-images";
import { deleteFromCloudinary, extractCloudinaryPublicId } from "../lib/cloudinary";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isBackupOnly = args.includes("--backup-only");

const CHAT_LOG_FILE = path.resolve(process.cwd(), "chat-migration-log.jsonl");
const CHAT_FAILURES_FILE = path.resolve(process.cwd(), "chat-failures.jsonl");

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

function getCompletedChatUrls(): Set<string> {
  const completed = new Set<string>();
  if (fs.existsSync(CHAT_LOG_FILE)) {
    const lines = fs.readFileSync(CHAT_LOG_FILE, "utf-8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.oldUrl && entry.status === "COMPLETED") {
          completed.add(`${entry.chatId}:${entry.messageId}:${entry.oldUrl}`);
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

export function buildChatR2Key(chatId: string, messageId: string, oldUrl: string): string {
  const publicId = extractCloudinaryPublicId(oldUrl) || "chat_asset";
  const cleanId = publicId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `chat/${chatId}/${messageId}/${cleanId}.png`;
}

interface ChatMigrationItem {
  chatId: string;
  messageId: string;
  field: string;
  oldUrl: string;
  docRef: any;
}

async function processChatItem(
  item: ChatMigrationItem,
  completedSet: Set<string>
): Promise<{ success: boolean; skipped: boolean; error?: string }> {
  const itemKey = `${item.chatId}:${item.messageId}:${item.oldUrl}`;
  if (completedSet.has(itemKey)) {
    return { success: true, skipped: true };
  }

  const backupKey = buildChatR2Key(item.chatId, item.messageId, item.oldUrl);
  const alreadyInR2 = await verifyBackup(backupKey, false);

  try {
    let imageBuffer: Buffer;

    if (alreadyInR2) {
      imageBuffer = await downloadBackup(backupKey);
    } else {
      const res = await fetch(item.oldUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch Cloudinary chat image (${res.statusText}): ${item.oldUrl}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);

      await uploadBackup(backupKey, imageBuffer, false);
      const verified = await verifyBackup(backupKey, false);
      if (!verified) {
        throw new Error(`R2 chat backup verification failed for key: ${backupKey}`);
      }
    }

    if (isBackupOnly) {
      appendLog(CHAT_LOG_FILE, {
        chatId: item.chatId,
        messageId: item.messageId,
        oldUrl: item.oldUrl,
        newUrl: null,
        backupKey,
        timestamp: new Date().toISOString(),
        status: "BACKUP_ONLY",
      });
      return { success: true, skipped: false };
    }

    const mimeType = "image/png";
    const base64Data = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    const newDeliveryUrl = await uploadToImages(base64Data);

    if (isDryRun) {
      console.log(`[DRY-RUN] Would update chat message ${item.messageId} -> ${newDeliveryUrl}`);
      return { success: true, skipped: false };
    }

    // Update Firestore message document
    await item.docRef.update({ [item.field]: newDeliveryUrl });

    // Delete original from Cloudinary
    await deleteFromCloudinary(item.oldUrl);

    appendLog(CHAT_LOG_FILE, {
      chatId: item.chatId,
      messageId: item.messageId,
      oldUrl: item.oldUrl,
      newUrl: newDeliveryUrl,
      backupKey,
      timestamp: new Date().toISOString(),
      status: "COMPLETED",
    });

    completedSet.add(itemKey);
    return { success: true, skipped: false };
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    appendLog(CHAT_FAILURES_FILE, {
      chatId: item.chatId,
      messageId: item.messageId,
      oldUrl: item.oldUrl,
      timestamp: new Date().toISOString(),
      error: errorMsg,
    });
    return { success: false, skipped: false, error: errorMsg };
  }
}

async function run() {
  const { getAdminDb } = await import("../lib/firebase-admin");
  const db = getAdminDb();
  if (!db) {
    console.error("Firebase Admin SDK is unconfigured. Cannot run Firestore chat image migration.");
    process.exit(1);
  }

  const completedSet = getCompletedChatUrls();
  const chatItems: ChatMigrationItem[] = [];

  console.log("Scanning Firestore supportChats messages...");
  const chatsSnap = await db.collection("supportChats").get();

  for (const chatDoc of chatsSnap.docs) {
    const chatId = chatDoc.id;
    const messagesSnap = await chatDoc.ref.collection("messages").get();

    for (const msgDoc of messagesSnap.docs) {
      const data = msgDoc.data();
      const messageId = msgDoc.id;

      if (data.imageUrl && typeof data.imageUrl === "string" && data.imageUrl.includes("res.cloudinary.com")) {
        chatItems.push({
          chatId,
          messageId,
          field: "imageUrl",
          oldUrl: data.imageUrl,
          docRef: msgDoc.ref,
        });
      }
      if (data.text && typeof data.text === "string" && data.text.includes("res.cloudinary.com")) {
        chatItems.push({
          chatId,
          messageId,
          field: "text",
          oldUrl: data.text,
          docRef: msgDoc.ref,
        });
      }
    }
  }

  console.log(`\nFound ${chatItems.length} Cloudinary chat image assets in Firestore.`);
  if (isDryRun) console.log("Mode: DRY-RUN");
  if (isBackupOnly) console.log("Mode: BACKUP-ONLY");

  let backedUp = 0;
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  const CONCURRENCY_CAP = 5;
  for (let i = 0; i < chatItems.length; i += CONCURRENCY_CAP) {
    const chunk = chatItems.slice(i, i + CONCURRENCY_CAP);
    const results = await Promise.all(
      chunk.map((item) => processChatItem(item, completedSet))
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
  console.log("💬 FIRESTORE CHAT MIGRATION SUMMARY");
  console.log("==========================================");
  console.log(`Total Scanned:      ${chatItems.length}`);
  console.log(`Backed Up to R2:    ${backedUp}`);
  console.log(`Migrated:           ${migrated}`);
  console.log(`Skipped (Done):     ${skipped}`);
  console.log(`Failed:             ${failed}`);
  console.log("==========================================\n");

  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith("migrate-firestore-chat-images.ts")) {
  run().catch((err) => {
    console.error("Chat migration error:", err);
    process.exit(1);
  });
}

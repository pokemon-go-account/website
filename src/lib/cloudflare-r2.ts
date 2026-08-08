import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export function getR2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "260a0d7b7335fef1f8d7edf667de745c";
  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.CF_IMAGES_API_TOKEN;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName =
    process.env.R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    "pokemon-go-auctions";
  const publicUrl = (
    process.env.R2_PUBLIC_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    `https://pub-${accountId}.r2.dev`
  ).replace(/\/$/, "");

  const isConfigured =
    !!accountId &&
    !!accessKeyId &&
    !!secretAccessKey &&
    accountId !== "account_id_placeholder" &&
    accessKeyId !== "token_placeholder" &&
    secretAccessKey !== "secret_placeholder";

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl, isConfigured };
}

let s3ClientInstance: S3Client | null = null;

function getS3Client() {
  const { accountId, accessKeyId, secretAccessKey, isConfigured } = getR2Config();
  if (!isConfigured || !accessKeyId || !secretAccessKey) return null;

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3ClientInstance;
}

/**
 * Upload an image asset (base64 data URL or URL) to Cloudflare R2 Object Storage.
 * Falls back gracefully to raw data URL / mock image if R2 environment variables are unconfigured.
 */
export async function uploadToR2(fileData: string): Promise<string> {
  const { bucketName, publicUrl, isConfigured } = getR2Config();
  const s3Client = getS3Client();

  if (!isConfigured || !s3Client) {
    console.warn("Cloudflare R2 is not fully configured. Returning image fallback.");
    if (fileData && fileData.startsWith("data:image/")) {
      return fileData;
    }
    const mockImages = [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1613771404724-11d595413b6b?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=800&auto=format&fit=crop&q=80",
    ];
    return mockImages[Math.floor(Math.random() * mockImages.length)];
  }

  try {
    let buffer: Buffer;
    let contentType = "image/png";
    let extension = "png";

    if (fileData.startsWith("data:")) {
      const match = fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        buffer = Buffer.from(match[2], "base64");
        const extMatch = contentType.split("/")[1];
        if (extMatch) extension = extMatch;
      } else {
        buffer = Buffer.from(fileData);
      }
    } else if (fileData.startsWith("http://") || fileData.startsWith("https://")) {
      const res = await fetch(fileData);
      if (!res.ok) throw new Error(`Failed to fetch image from URL: ${res.statusText}`);
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = res.headers.get("content-type") || "image/png";
    } else {
      buffer = Buffer.from(fileData, "base64");
    }

    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error("Image size exceeds 5MB limit. Please upload an image smaller than 5MB.");
    }

    const fileKey = `uploads/${Date.now()}-${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return `${publicUrl}/${fileKey}`;
  } catch (error: any) {
    console.error("[Cloudflare R2] Upload error:", error);
    if (fileData && fileData.startsWith("data:image/")) {
      return fileData;
    }
    throw new Error(error.message || "Failed to upload asset to R2.");
  }
}

/**
 * Extract R2 object key from a public R2 URL.
 * Supports r2.dev, custom domain URLs, or r2.cloudflarestorage.com URLs.
 */
export function extractR2Key(url: string): string | null {
  try {
    if (!url || typeof url !== "string") return null;
    const { publicUrl } = getR2Config();
    
    if (publicUrl && url.startsWith(publicUrl)) {
      const key = url.slice(publicUrl.length).replace(/^\//, "");
      return key || null;
    }

    if (url.includes(".r2.dev/") || url.includes(".r2.cloudflarestorage.com/")) {
      const match = url.match(/(?:\.r2\.dev|\.r2\.cloudflarestorage\.com)\/(.+)$/);
      return match && match[1] ? match[1] : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Delete one or more objects from Cloudflare R2 by their URLs.
 * Silently skips non-R2 URLs or unconfigured environments.
 */
export async function deleteFromR2(urls: string | string[]): Promise<void> {
  const { bucketName, isConfigured } = getR2Config();
  const s3Client = getS3Client();

  if (!isConfigured || !s3Client) {
    return;
  }

  const urlList = Array.isArray(urls) ? urls : [urls];
  const keys = urlList.map(extractR2Key).filter((k): k is string => k !== null);

  if (keys.length === 0) return;

  try {
    if (keys.length === 1) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: keys[0],
        })
      );
    } else {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: keys.map((key) => ({ Key: key })),
          },
        })
      );
    }
  } catch (err) {
    console.error("[Cloudflare R2] Failed to delete object(s):", err);
  }
}

// Export backward-compatible aliases
export const uploadToImages = uploadToR2;
export const deleteFromImages = deleteFromR2;
export const extractImageId = extractR2Key;

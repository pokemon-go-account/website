import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getR2Config() {
  const accountId =
    process.env.R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    "260a0d7b7335fef1f8d7edf667de745c";
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
    "website";
  const endpoint =
    process.env.R2_ENDPOINT ||
    `https://${accountId}.r2.cloudflarestorage.com`;
  const publicUrl = (
    process.env.R2_PUBLIC_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    "https://cdn.pokemongoservices.com"
  ).replace(/\/$/, "");

  return { accountId, accessKeyId, secretAccessKey, bucketName, endpoint, publicUrl };
}

let s3ClientInstance: S3Client | null = null;

export function getR2S3Client(): S3Client {
  const { accessKeyId, secretAccessKey, endpoint } = getR2Config();
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
      },
    });
  }
  return s3ClientInstance;
}

/**
 * Upload an image backup to Cloudflare R2 Object Storage.
 * @param key The R2 key path (e.g. mongo/Product/123/imageUrl/pic.jpg)
 * @param bytes The raw image Buffer
 * @param isPrivate If true, stores under private prefix and returns signed GET URL
 */
export async function uploadBackup(
  key: string,
  bytes: Buffer,
  isPrivate: boolean = false
): Promise<string> {
  const { bucketName, publicUrl } = getR2Config();
  const s3 = getR2S3Client();

  const finalKey = isPrivate && !key.startsWith("private/") ? `private/${key}` : key;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: finalKey,
    Body: bytes,
  });

  await s3.send(command);

  if (isPrivate) {
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: finalKey,
    });
    return await getSignedUrl(s3, getCommand, { expiresIn: 86400 });
  }

  return `${publicUrl}/${finalKey}`;
}

/**
 * Download a backup object directly from Cloudflare R2 via authenticated S3 GET request.
 */
export async function downloadBackup(key: string): Promise<Buffer> {
  const { bucketName } = getR2Config();
  const s3 = getR2S3Client();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3.send(command);
  if (!response.Body) {
    throw new Error(`R2 GetObject returned empty body for key: ${key}`);
  }

  const byteArray = await response.Body.transformToByteArray();
  return Buffer.from(byteArray);
}

/**
 * Verify that a backup object exists in R2.
 */
export async function verifyBackup(
  key: string,
  isPrivate: boolean = false
): Promise<boolean> {
  const { bucketName, publicUrl } = getR2Config();
  const s3 = getR2S3Client();
  const finalKey = isPrivate && !key.startsWith("private/") ? `private/${key}` : key;

  try {
    if (isPrivate) {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: finalKey,
      });
      await s3.send(command);
      return true;
    }

    const url = `${publicUrl}/${finalKey}`;
    const res = await fetch(url, { method: "HEAD" });
    if (res.status === 200 || res.status === 304) {
      return true;
    }

    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: finalKey,
    });
    await s3.send(command);
    return true;
  } catch {
    return false;
  }
}

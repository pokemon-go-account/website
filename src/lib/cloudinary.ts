import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = 
  !!cloudName && 
  !!apiKey && 
  !!apiSecret && 
  cloudName !== "cloud_placeholder" &&
  apiKey !== "key_placeholder" &&
  apiSecret !== "secret_placeholder";

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Upload an image (base64 data URL format) to Cloudinary.
 * If Cloudinary environment variables are missing, falls back to a sandbox simulation.
 */
export async function uploadToCloudinary(fileData: string): Promise<string> {
  if (!isConfigured) {
    console.warn("Cloudinary is not configured. Returning image data URL fallback.");
    if (fileData.startsWith("data:image/")) {
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
    const uploadResult = await cloudinary.uploader.upload(fileData, {
      folder: "pokemon_go_auctions",
      resource_type: "image",
    });
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed, falling back to data URL:", error);
    if (fileData.startsWith("data:image/")) {
      return fileData;
    }
    throw new Error("Failed to upload image asset.");
  }
}

/**
 * Extract a Cloudinary public_id from a secure URL.
 * URL format: https://res.cloudinary.com/<cloud>/image/upload/v<ver>/<folder>/<name>.<ext>
 * Returns null if the URL is not a Cloudinary URL or cannot be parsed.
 */
export function extractCloudinaryPublicId(url: string): string | null {
  try {
    // Only process actual Cloudinary URLs, skip mock/external URLs
    if (!url || !url.includes("res.cloudinary.com")) return null;
    // Match everything after /upload/ (optional version segment stripped)
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Delete one or more images from Cloudinary by their secure URLs.
 * Silently skips non-Cloudinary URLs (external / mock sandbox images).
 * Silently no-ops when Cloudinary is not configured.
 */
export async function deleteFromCloudinary(urls: string | string[]): Promise<void> {
  if (!isConfigured) {
    // Not configured — nothing to delete
    return;
  }

  const urlList = Array.isArray(urls) ? urls : [urls];
  const publicIds = urlList
    .map(extractCloudinaryPublicId)
    .filter((id): id is string => id !== null);

  if (publicIds.length === 0) return;

  await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch((err) => {
        console.error(`[Cloudinary] Failed to delete asset "${publicId}":`, err);
      })
    )
  );
}

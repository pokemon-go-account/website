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
    console.warn("Cloudinary is not configured. Simulating asset upload.");
    
    // Fallback to high-quality unsplash images to make listing look stunning
    const mockImages = [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80", // Anime purple character
      "https://images.unsplash.com/photo-1613771404724-11d595413b6b?w=800&auto=format&fit=crop&q=80", // Pikachu figure
      "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=800&auto=format&fit=crop&q=80", // Pokemon style card
    ];
    const index = Math.floor(Math.random() * mockImages.length);
    return mockImages[index];
  }

  try {
    const uploadResult = await cloudinary.uploader.upload(fileData, {
      folder: "pokemon_go_auctions",
      resource_type: "image",
    });
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error("Failed to upload image asset to Cloudinary.");
  }
}

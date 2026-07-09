import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let appInitialized = false;

// 1. Check for single service account JSON environment variable
let serviceAccount: any = null;
const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (rawServiceAccount) {
  try {
    const trimmed = rawServiceAccount.trim();
    if (trimmed.startsWith("{")) {
      serviceAccount = JSON.parse(trimmed);
    } else {
      // Decode base64
      const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
      serviceAccount = JSON.parse(decoded);
    }
  } catch (err) {
    console.error("Failed to parse Firebase service account JSON string:", err);
  }
}

// 2. Initialize using parsed service account or individual variables
if (getApps().length === 0) {
  try {
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
      appInitialized = true;
    } else if (
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/^"(.*)"$/, "$1"),
        }),
      });
      appInitialized = true;
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
} else if (getApps().length > 0) {
  appInitialized = true;
}

export interface FirebaseDecodedUser {
  uid: string;
  email?: string;
  phone?: string;
  name?: string;
}

/**
 * Verifies a Firebase ID token on the server.
 * In development/test, or when keys are missing, decodes the JWT payload safely in sandbox mode.
 */
export async function verifyFirebaseIdToken(token: string): Promise<FirebaseDecodedUser> {
  // If service account is configured, verify signature using Firebase Admin SDK
  if (appInitialized) {
    try {
      const decoded = await getAuth().verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email,
        phone: decoded.phone_number,
        name: decoded.name,
      };
    } catch (err) {
      console.error("Firebase token verification failed:", err);
      throw new Error("Invalid token signature.");
    }
  }

  // Graceful Sandbox Fallback: Decode the JWT manually without checking signature
  if (process.env.NODE_ENV === "production") {
    throw new Error("Firebase Service Account is not configured. Unauthorized sandbox bypass attempt.");
  }
  console.warn("Firebase Service Account is not configured. Falling back to sandbox/manual token decoding.");
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      throw new Error("Token payload section missing.");
    }
    const payloadDecoded = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf-8"));
    
    return {
      uid: payloadDecoded.user_id || payloadDecoded.sub || "mock_uid_123456",
      email: payloadDecoded.email,
      phone: payloadDecoded.phone_number,
      name: payloadDecoded.name,
    };
  } catch (err) {
    console.error("Sandbox Mode manual token decode error:", err);
    throw new Error("Failed to parse mock token payload.");
  }
}

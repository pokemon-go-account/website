import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const isServiceAccountConfigured = 
  !!process.env.FIREBASE_PROJECT_ID && 
  !!process.env.FIREBASE_CLIENT_EMAIL && 
  !!process.env.FIREBASE_PRIVATE_KEY;

let appInitialized = false;

if (isServiceAccountConfigured && getApps().length === 0) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    appInitialized = true;
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
 * In development, if Service Account keys are missing, decodes the JWT payload safely.
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

  // Graceful Dev Fallback: Decode the JWT manually without checking signature
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    try {
      const payloadBase64 = token.split(".")[1];
      const payloadDecoded = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf-8"));
      
      return {
        uid: payloadDecoded.user_id || payloadDecoded.sub || "mock_uid_123456",
        email: payloadDecoded.email,
        phone: payloadDecoded.phone_number,
        name: payloadDecoded.name,
      };
    } catch (err) {
      console.error("Dev Mode manual token decode error:", err);
      throw new Error("Failed to parse mock token payload.");
    }
  }

  throw new Error("Firebase Service Account is not configured in production.");
}

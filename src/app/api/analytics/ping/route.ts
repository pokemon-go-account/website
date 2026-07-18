import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PageView from "@/models/PageView";
import { getFirestore } from "firebase-admin/firestore";
import "@/lib/firebase-admin";

declare global {
  var __ACTIVE_SESSIONS__: Map<string, {
    visitorId: string;
    path: string;
    country: string;
    countryCode: string;
    device: string;
    lastActive: number;
  }> | undefined;
}

if (!global.__ACTIVE_SESSIONS__) {
  global.__ACTIVE_SESSIONS__ = new Map();
}

const countryNames: Record<string, string> = {
  US: "United States",
  IN: "India",
  GB: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  AU: "Australia",
  JP: "Japan",
  BR: "Brazil",
  SG: "Singapore",
  AE: "United Arab Emirates",
  NL: "Netherlands",
  ES: "Spain",
  IT: "Italy",
  SE: "Sweden",
  MX: "Mexico",
  ID: "Indonesia",
  PK: "Pakistan",
  BD: "Bangladesh",
  PH: "Philippines",
  VN: "Vietnam",
  TH: "Thailand",
  ZA: "South Africa",
  KR: "South Korea",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { visitorId, path, referrer, isNewPage, action } = body;

    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json({ success: false, error: "Missing visitorId" }, { status: 400 });
    }

    const currentPath = typeof path === "string" ? path : "/";

    // Detect Country Code from Edge/CDN headers
    const rawCountryCode =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code") ||
      "IN";

    const countryCode = rawCountryCode.toUpperCase();
    const country = countryNames[countryCode] || countryCode;

    // Detect Device Type
    const userAgent = req.headers.get("user-agent") || "";
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const device = isMobile ? "mobile" : "desktop";

    const now = Date.now();

    // 1. Handle disconnect / tab unload
    if (action === "disconnect") {
      global.__ACTIVE_SESSIONS__?.delete(visitorId);
      try {
        const firestore = getFirestore();
        await firestore.collection("active_sessions").doc(visitorId).delete();
      } catch (err) {
        // Soft catch
      }
      return NextResponse.json({ success: true });
    }

    // 2. Update In-Memory Active Session
    global.__ACTIVE_SESSIONS__?.set(visitorId, {
      visitorId,
      path: currentPath,
      country,
      countryCode,
      device,
      lastActive: now,
    });

    // Clean up stale sessions (> 45s) from memory
    if (global.__ACTIVE_SESSIONS__) {
      for (const [key, session] of global.__ACTIVE_SESSIONS__.entries()) {
        if (now - session.lastActive > 45000) {
          global.__ACTIVE_SESSIONS__.delete(key);
        }
      }
    }

    // 3. Update Firebase Firestore active_sessions for live presence
    try {
      const firestore = getFirestore();
      await firestore.collection("active_sessions").doc(visitorId).set(
        {
          visitorId,
          path: currentPath,
          country,
          countryCode,
          device,
          lastActive: now,
        },
        { merge: true }
      );
    } catch (err) {
      // Soft catch
    }

    // 4. Log PageView to MongoDB if it's a new page view and not an admin console page
    if (isNewPage && !currentPath.startsWith("/console")) {
      try {
        await connectDB();
        await PageView.create({
          visitorId,
          path: currentPath,
          country,
          countryCode,
          referrer: typeof referrer === "string" ? referrer.slice(0, 300) : "",
          device,
        });
      } catch (mongoErr) {
        console.error("Failed to persist PageView to MongoDB:", mongoErr);
      }
    }

    return NextResponse.json({
      success: true,
      country,
      countryCode,
    });
  } catch (error: any) {
    console.error("Analytics ping error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

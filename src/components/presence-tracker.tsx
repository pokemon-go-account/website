"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { database, app } from "@/lib/firebase";
import { ref, onValue, set, onDisconnect, remove, increment, getDatabase } from "firebase/database";

interface GeoInfo {
  country: string;
  countryCode: string;
  flag: string;
}

// Map timezone prefixes to fast country defaults as immediate fallback
function getFallbackGeo(): GeoInfo {
  if (typeof window === "undefined") return { country: "Global", countryCode: "UN", flag: "🌐" };
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("Kolkata") || tz.includes("India")) return { country: "India", countryCode: "IN", flag: "🇮🇳" };
    if (tz.includes("New_York") || tz.includes("Chicago") || tz.includes("Los_Angeles") || tz.includes("Denver")) return { country: "United States", countryCode: "US", flag: "🇺🇸" };
    if (tz.includes("London")) return { country: "United Kingdom", countryCode: "GB", flag: "🇬🇧" };
    if (tz.includes("Toronto") || tz.includes("Vancouver")) return { country: "Canada", countryCode: "CA", flag: "🇨🇦" };
    if (tz.includes("Sydney") || tz.includes("Melbourne")) return { country: "Australia", countryCode: "AU", flag: "🇦🇺" };
    if (tz.includes("Berlin") || tz.includes("Frankfurt")) return { country: "Germany", countryCode: "DE", flag: "🇩🇪" };
    if (tz.includes("Paris")) return { country: "France", countryCode: "FR", flag: "🇫🇷" };
    if (tz.includes("Tokyo")) return { country: "Japan", countryCode: "JP", flag: "🇯🇵" };
  } catch (_) {}
  return { country: "Global", countryCode: "UN", flag: "🌐" };
}

// Encode pathname for Firebase key safety
export function encodePathKey(path: string): string {
  if (!path || path === "/") return "~root";
  return path.replace(/\//g, "~").replace(/\./g, "_dot_").replace(/#/g, "_hash_");
}

// Decode pathname back for display
export function decodePathKey(key: string): string {
  if (key === "~root") return "/";
  return key.replace(/~/g, "/").replace(/_dot_/g, ".").replace(/_hash_/g, "#");
}

export function PresenceTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const db = database || (app ? getDatabase(app) : null);
    if (!db) return;

    // Session ID (temporary per tab/window)
    let sessionId = sessionStorage.getItem("pogo_presence_sid");
    if (!sessionId) {
      sessionId = `s_${Math.random().toString(36).substring(2, 10)}`;
      sessionStorage.setItem("pogo_presence_sid", sessionId);
    }

    // Persistent Visitor ID (shared across all tabs on the same browser/device)
    let storedId = localStorage.getItem("pogo_visitor_id");
    if (!storedId) {
      storedId = `v_${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem("pogo_visitor_id", storedId);
    }
    const visitorId: string = storedId;

    // Unique presence key per person/device (deduplicates multi-tab online presence)
    const presenceKey = session?.user?.id ? `u_${session.user.id}` : visitorId;

    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const pathKey = encodePathKey(pathname || "/");
    const pageTitle = typeof document !== "undefined" ? document.title || pathname || "/" : pathname || "/";

    // Deduplicate view counts in current tab session for exact same page refresh
    const pageViewKey = `pv_${todayStr}_${pathKey}`;
    if (!sessionStorage.getItem(pageViewKey)) {
      sessionStorage.setItem(pageViewKey, "1");

      // Record page views & unique visitor directly via Firebase WebSocket (0 serverless API pings)
      const dailyTotalRef = ref(db, `analytics/dailyViews/${todayStr}`);
      set(dailyTotalRef, increment(1)).catch(() => {});

      const pageViewsRef = ref(db, `analytics/pageViews/${todayStr}/${pathKey}`);
      set(pageViewsRef, increment(1)).catch(() => {});

      const pageTitleRef = ref(db, `analytics/pageTitles/${pathKey}`);
      set(pageTitleRef, pageTitle).catch(() => {});

      const uniqueRef = ref(db, `analytics/uniqueVisitors/${todayStr}/${visitorId}`);
      set(uniqueRef, {
        userName: session?.user?.name || session?.user?.email?.split("@")[0] || "Guest",
        lastPath: pathname,
        timestamp: Date.now(),
      }).catch(() => {});
    }

    // Resolve Geo location (Cached in sessionStorage)
    let geo = getFallbackGeo();
    const cachedGeo = sessionStorage.getItem("pogo_presence_geo");
    if (cachedGeo) {
      try { geo = JSON.parse(cachedGeo); } catch (_) {}
    } else {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.country_name) {
            const countryCode = data.country_code || "UN";
            const flag = countryCode
              .toUpperCase()
              .replace(/./g, (char: string) => String.fromCodePoint(127397 + char.charCodeAt(0)));
            const newGeo = { country: data.country_name, countryCode, flag };
            sessionStorage.setItem("pogo_presence_geo", JSON.stringify(newGeo));
            updatePresence(newGeo);
          }
        })
        .catch(() => {});
    }

    const userRef = ref(db, `presence/${presenceKey}`);
    const connectedRef = ref(db, ".info/connected");
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    function updatePresence(currentGeo: GeoInfo) {
      if (!db || !presenceKey) return;
      const userName = session?.user?.name || (session?.user?.email ? session.user.email.split("@")[0] : `Guest #${visitorId.slice(-4)}`);
      
      const payload = {
        sessionId,
        visitorId,
        userId: session?.user?.id || null,
        userName,
        userEmail: session?.user?.email || null,
        userImage: session?.user?.image || null,
        pathname: pathname || "/",
        pageTitle,
        country: currentGeo.country,
        countryCode: currentGeo.countryCode,
        flag: currentGeo.flag,
        device: isMobile ? "Mobile" : "Desktop",
        lastSeen: Date.now()
      };

      onDisconnect(userRef).remove().catch(() => {});
      set(userRef, payload).catch(() => {});
    }

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        updatePresence(geo);
      }
    });

    const handleBeforeUnload = () => {
      // Optional: keep presence if other tabs are still open
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      unsubscribeConnected();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname, session?.user?.id, session?.user?.name, status]);

  return null;
}

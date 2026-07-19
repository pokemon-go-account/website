"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { database, app } from "@/lib/firebase";
import { ref, onValue, set, update, onDisconnect, remove, increment, getDatabase } from "firebase/database";

interface GeoInfo {
  country: string;
  countryCode: string;
  flag: string;
}

// Extensive timezone to specific country mapping
function getFallbackGeo(): GeoInfo {
  if (typeof window === "undefined") return { country: "United States", countryCode: "US", flag: "🇺🇸" };
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    
    // South Asia
    if (tz.includes("Kolkata") || tz.includes("India")) return { country: "India", countryCode: "IN", flag: "🇮🇳" };
    if (tz.includes("Dhaka")) return { country: "Bangladesh", countryCode: "BD", flag: "🇧🇩" };
    if (tz.includes("Karachi")) return { country: "Pakistan", countryCode: "PK", flag: "🇵🇰" };
    if (tz.includes("Kathmandu")) return { country: "Nepal", countryCode: "NP", flag: "🇳🇵" };
    if (tz.includes("Colombo")) return { country: "Sri Lanka", countryCode: "LK", flag: "🇱🇰" };

    // Middle East
    if (tz.includes("Dubai") || tz.includes("Abu_Dhabi")) return { country: "United Arab Emirates", countryCode: "AE", flag: "🇦🇪" };
    if (tz.includes("Riyadh")) return { country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦" };
    if (tz.includes("Istanbul")) return { country: "Turkey", countryCode: "TR", flag: "🇹🇷" };

    // East / South-East Asia
    if (tz.includes("Singapore")) return { country: "Singapore", countryCode: "SG", flag: "🇸🇬" };
    if (tz.includes("Kuala_Lumpur")) return { country: "Malaysia", countryCode: "MY", flag: "🇲🇾" };
    if (tz.includes("Bangkok")) return { country: "Thailand", countryCode: "TH", flag: "🇹🇭" };
    if (tz.includes("Jakarta")) return { country: "Indonesia", countryCode: "ID", flag: "🇮🇩" };
    if (tz.includes("Manila")) return { country: "Philippines", countryCode: "PH", flag: "🇵🇭" };
    if (tz.includes("Ho_Chi_Minh")) return { country: "Vietnam", countryCode: "VN", flag: "🇻🇳" };
    if (tz.includes("Hong_Kong")) return { country: "Hong Kong", countryCode: "HK", flag: "🇭🇰" };
    if (tz.includes("Seoul")) return { country: "South Korea", countryCode: "KR", flag: "🇰🇷" };
    if (tz.includes("Tokyo")) return { country: "Japan", countryCode: "JP", flag: "🇯🇵" };

    // North America
    if (tz.includes("New_York") || tz.includes("Chicago") || tz.includes("Los_Angeles") || tz.includes("Denver") || tz.includes("Phoenix") || tz.includes("Honolulu")) {
      return { country: "United States", countryCode: "US", flag: "🇺🇸" };
    }
    if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("Edmonton") || tz.includes("Halifax")) {
      return { country: "Canada", countryCode: "CA", flag: "🇨🇦" };
    }
    if (tz.includes("Mexico_City")) return { country: "Mexico", countryCode: "MX", flag: "🇲🇽" };

    // Europe
    if (tz.includes("London")) return { country: "United Kingdom", countryCode: "GB", flag: "🇬🇧" };
    if (tz.includes("Berlin") || tz.includes("Frankfurt")) return { country: "Germany", countryCode: "DE", flag: "🇩🇪" };
    if (tz.includes("Paris")) return { country: "France", countryCode: "FR", flag: "🇫🇷" };
    if (tz.includes("Rome")) return { country: "Italy", countryCode: "IT", flag: "🇮🇹" };
    if (tz.includes("Madrid")) return { country: "Spain", countryCode: "ES", flag: "🇪🇸" };
    if (tz.includes("Amsterdam")) return { country: "Netherlands", countryCode: "NL", flag: "🇳🇱" };
    if (tz.includes("Brussels")) return { country: "Belgium", countryCode: "BE", flag: "🇧🇪" };
    if (tz.includes("Vienna")) return { country: "Austria", countryCode: "AT", flag: "🇦🇹" };
    if (tz.includes("Zurich")) return { country: "Switzerland", countryCode: "CH", flag: "🇨🇭" };
    if (tz.includes("Stockholm")) return { country: "Sweden", countryCode: "SE", flag: "🇸🇪" };
    if (tz.includes("Oslo")) return { country: "Norway", countryCode: "NO", flag: "🇳🇴" };
    if (tz.includes("Helsinki")) return { country: "Finland", countryCode: "FI", flag: "🇫🇮" };
    if (tz.includes("Copenhagen")) return { country: "Denmark", countryCode: "DK", flag: "🇩🇰" };
    if (tz.includes("Warsaw")) return { country: "Poland", countryCode: "PL", flag: "🇵🇱" };

    // Oceania
    if (tz.includes("Sydney") || tz.includes("Melbourne") || tz.includes("Brisbane") || tz.includes("Perth") || tz.includes("Adelaide")) {
      return { country: "Australia", countryCode: "AU", flag: "🇦🇺" };
    }
    if (tz.includes("Auckland")) return { country: "New Zealand", countryCode: "NZ", flag: "🇳🇿" };

    // Latin America & Africa
    if (tz.includes("Sao_Paulo")) return { country: "Brazil", countryCode: "BR", flag: "🇧🇷" };
    if (tz.includes("Buenos_Aires")) return { country: "Argentina", countryCode: "AR", flag: "🇦🇷" };
    if (tz.includes("Johannesburg")) return { country: "South Africa", countryCode: "ZA", flag: "🇿🇦" };
    if (tz.includes("Cairo")) return { country: "Egypt", countryCode: "EG", flag: "🇪🇬" };
  } catch (_) {}

  return { country: "United States", countryCode: "US", flag: "🇺🇸" };
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

    // Do not track console routes for guests or non-super-admins
    if (pathname?.startsWith("/console") && session?.user?.role !== "SUPER_ADMIN") {
      return;
    }

    const db = database || (app ? getDatabase(app) : null);
    if (!db) return;

    // Unique Tab ID per browser window/tab
    let tabId = window.name;
    if (!tabId || !tabId.startsWith("tab_")) {
      tabId = `tab_${Math.random().toString(36).substring(2, 10)}`;
      window.name = tabId;
    }
    const sessionId = tabId;

    // Persistent Visitor ID (shared across all tabs on the same browser/device)
    let storedId = localStorage.getItem("pogo_visitor_id");
    if (!storedId) {
      storedId = `v_${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem("pogo_visitor_id", storedId);
    }
    const visitorId: string = storedId;

    // Unique presence key per person/device
    const presenceKey = session?.user?.id ? `u_${session.user.id}` : visitorId;

    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const pathKey = encodePathKey(pathname || "/");
    const pageTitle = typeof document !== "undefined" ? document.title || pathname || "/" : pathname || "/";

    // Resolve Geo location (Cached in sessionStorage)
    let geo = getFallbackGeo();
    const cachedGeo = sessionStorage.getItem("pogo_presence_geo");
    if (cachedGeo) {
      try { geo = JSON.parse(cachedGeo); } catch (_) {}
    } else {
      // Primary API: ipapi.co with fallback to ip-api.com
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.country_name && data.country_name !== "Global") {
            const countryCode = data.country_code || "US";
            const flag = countryCode
              .toUpperCase()
              .replace(/./g, (char: string) => String.fromCodePoint(127397 + char.charCodeAt(0)));
            const newGeo = { country: data.country_name, countryCode, flag };
            sessionStorage.setItem("pogo_presence_geo", JSON.stringify(newGeo));
            updatePresence(newGeo);
            recordAnalytics(newGeo);
          } else {
            throw new Error("Fallback required");
          }
        })
        .catch(() => {
          fetch("https://ip-api.com/json")
            .then((res) => res.json())
            .then((data) => {
              if (data && data.country) {
                const countryCode = data.countryCode || "US";
                const flag = countryCode
                  .toUpperCase()
                  .replace(/./g, (char: string) => String.fromCodePoint(127397 + char.charCodeAt(0)));
                const newGeo = { country: data.country, countryCode, flag };
                sessionStorage.setItem("pogo_presence_geo", JSON.stringify(newGeo));
                updatePresence(newGeo);
                recordAnalytics(newGeo);
              }
            })
            .catch(() => {});
        });
    }

    function recordAnalytics(currentGeo: GeoInfo) {
      if (!db) return;
      const pageViewKey = `pv_${todayStr}_${pathKey}`;
      if (!sessionStorage.getItem(pageViewKey)) {
        sessionStorage.setItem(pageViewKey, "1");

        const dailyTotalRef = ref(db, `analytics/dailyViews/${todayStr}`);
        set(dailyTotalRef, increment(1)).catch(() => {});

        const pageViewsRef = ref(db, `analytics/pageViews/${todayStr}/${pathKey}`);
        set(pageViewsRef, increment(1)).catch(() => {});

        const pageTitleRef = ref(db, `analytics/pageTitles/${pathKey}`);
        set(pageTitleRef, pageTitle).catch(() => {});

        // Record Country Analytics
        const countryViewsRef = ref(db, `analytics/countryViews/${todayStr}/${currentGeo.countryCode}`);
        set(countryViewsRef, increment(1)).catch(() => {});

        const countryMetaRef = ref(db, `analytics/countryMeta/${currentGeo.countryCode}`);
        set(countryMetaRef, { country: currentGeo.country, flag: currentGeo.flag, countryCode: currentGeo.countryCode }).catch(() => {});

        const uniqueRef = ref(db, `analytics/uniqueVisitors/${todayStr}/${visitorId}`);
        set(uniqueRef, {
          userName: session?.user?.name || session?.user?.email?.split("@")[0] || "Guest",
          lastPath: pathname,
          country: currentGeo.country,
          countryCode: currentGeo.countryCode,
          flag: currentGeo.flag,
          timestamp: Date.now(),
        }).catch(() => {});
      }
    }

    recordAnalytics(geo);

    const userRootRef = ref(db, `presence/${presenceKey}`);
    const tabRef = ref(db, `presence/${presenceKey}/tabs/${sessionId}`);
    const connectedRef = ref(db, ".info/connected");
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    function updatePresence(currentGeo: GeoInfo) {
      if (!db || !presenceKey || !sessionId) return;
      const userName = session?.user?.name || (session?.user?.email ? session.user.email.split("@")[0] : `Guest #${visitorId ? visitorId.slice(-4) : "0000"}`);
      
      const rootPayload = {
        presenceKey,
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

      const tabPayload = {
        sessionId,
        pathname: pathname || "/",
        pageTitle,
        lastSeen: Date.now()
      };

      onDisconnect(tabRef).remove().catch(() => {});
      update(userRootRef, rootPayload).catch(() => {});
      set(tabRef, tabPayload).catch(() => {});
    }

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        updatePresence(geo);
      }
    });

    const heartbeatTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        updatePresence(geo);
      }
    }, 12000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updatePresence(geo);
      }
    };

    const handleUnload = () => {
      remove(tabRef).catch(() => {});
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      unsubscribeConnected();
      clearInterval(heartbeatTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      remove(tabRef).catch(() => {});
    };
  }, [pathname, session?.user?.id, session?.user?.name, status]);

  return null;
}

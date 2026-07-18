"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Helper to get or generate persistent unique visitor ID
function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem("pkgo_visitor_id");
    if (!id) {
      id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("pkgo_visitor_id", id);
    }
    return id;
  } catch {
    return "v_anon_" + Math.random().toString(36).substring(2, 9);
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string>("");
  const currentPathRef = useRef<string>("");

  useEffect(() => {
    visitorIdRef.current = getOrCreateVisitorId();
  }, []);

  const sendPing = (isNewPage: boolean, action?: string) => {
    const vid = visitorIdRef.current || getOrCreateVisitorId();
    if (!vid) return;

    const payload = JSON.stringify({
      visitorId: vid,
      path: pathname,
      referrer: isNewPage ? (typeof document !== "undefined" ? document.referrer : "") : "",
      isNewPage,
      action,
    });

    // Use sendBeacon if available for non-blocking browser dispatch
    if (action === "disconnect" && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/ping", blob);
      return;
    }

    // Otherwise use fetch with keepalive in background idle queue
    const dispatch = () => {
      fetch("/api/analytics/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* silent catch */
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => dispatch(), { timeout: 2000 });
    } else {
      setTimeout(dispatch, 0);
    }
  };

  // 1. Send ping whenever path changes
  useEffect(() => {
    if (!pathname) return;

    currentPathRef.current = pathname;
    sendPing(true);
  }, [pathname]);

  // 2. Set up periodic 15-second heartbeat for active presence tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        sendPing(false);
      }
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendPing(false);
      }
    };

    const handleUnload = () => {
      sendPing(false, "disconnect");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [pathname]);

  return null;
}

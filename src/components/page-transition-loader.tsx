"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function LoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Dismiss the loader immediately when the pathname or search params update
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Traverse up to find a potential anchor tag
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        const targetAttr = anchor.getAttribute("target");

        // Only trigger loading for internal links, ignoring external links, target="_blank", or page hashes
        if (
          href &&
          href.startsWith("/") &&
          !href.startsWith("/#") &&
          targetAttr !== "_blank" &&
          !event.defaultPrevented &&
          event.button === 0 && // Left-click only
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          // Compare paths to avoid loading when clicking the exact same URL
          try {
            const currentUrl = new URL(window.location.href);
            const targetUrl = new URL(href, window.location.href);
            if (currentUrl.pathname !== targetUrl.pathname || currentUrl.search !== targetUrl.search) {
              setLoading(true);
            }
          } catch (_) {
            setLoading(true);
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div className="bg-zinc-900/95 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl max-w-xs text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center">
          {/* Outer elegant spinning gradient */}
          <div className="h-12 w-12 rounded-full border-2 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          {/* Inner solid spinner */}
          <Loader2 className="absolute h-6 w-6 animate-spin text-violet-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white tracking-tight">Loading Page</p>
          <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
            Securing connections & preparing game assets...
          </p>
        </div>
      </div>
    </div>
  );
}

export function PageTransitionLoader() {
  return (
    <Suspense fallback={null}>
      <LoaderContent />
    </Suspense>
  );
}

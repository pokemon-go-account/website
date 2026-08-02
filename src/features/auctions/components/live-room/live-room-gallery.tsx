"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

interface LiveRoomGalleryProps {
  screenshots: string[];
  teamColors: Record<string, string>;
  team: string;
}

export function LiveRoomGallery({ screenshots, teamColors, team }: LiveRoomGalleryProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const nextImage = useCallback(() => {
    setActiveImgIndex((prev) => (prev + 1) % screenshots.length);
    setIsZoomed(false);
  }, [screenshots.length]);

  const prevImage = useCallback(() => {
    setActiveImgIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    setIsZoomed(false);
  }, [screenshots.length]);

  // Keyboard navigation for Lightbox (Esc, Left, Right)
  useEffect(() => {
    if (!isZoomOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsZoomOpen(false);
        setIsZoomed(false);
      } else if (e.key === "ArrowLeft" && screenshots.length > 1) {
        prevImage();
      } else if (e.key === "ArrowRight" && screenshots.length > 1) {
        nextImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen, screenshots.length, prevImage, nextImage]);

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-4 sm:p-5 space-y-4 shadow-xs relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-[#6133e1]/5 blur-2xl pointer-events-none" />

        {/* Main Viewer */}
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-zinc-50 dark:bg-black/20 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center group shadow-inner">

          {/* Team Tag Overlay */}
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <span className="bg-[#6133e1] text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md tracking-wider">
              Verified Asset
            </span>
            {team !== "NONE" && (
              <span className={cn("text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md border tracking-wider", teamColors[team])}>
                {team}
              </span>
            )}
          </div>

          {/* Main Display Image */}
          <img
            src={screenshots[activeImgIndex]}
            alt="Account preview screenshot"
            onClick={() => {
              setIsZoomOpen(true);
              setIsZoomed(false);
            }}
            className="w-full h-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-102 cursor-zoom-in"
          />

          {/* Left/Right Controls */}
          {screenshots.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95 z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95 z-10"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails Row */}
        {screenshots.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {screenshots.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveImgIndex(idx);
                  setIsZoomed(false);
                }}
                className={cn(
                  "relative h-12 w-16 rounded-lg overflow-hidden border bg-zinc-50 dark:bg-zinc-900 shrink-0 transition-all cursor-pointer",
                  activeImgIndex === idx
                    ? "border-[#6133e1] ring-2 ring-[#6133e1]/30 scale-95"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <img src={url} alt="thumbnail" className="w-full h-full object-contain p-0.5" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Responsive Lightbox Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-[99999] flex flex-col bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
          onClick={() => {
            setIsZoomOpen(false);
            setIsZoomed(false);
          }}
        >
          {/* Top Header Controls Bar */}
          <div
            className="relative h-14 w-full px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-black/40 z-30 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="bg-[#6133e1] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {activeImgIndex + 1} / {screenshots.length}
              </span>
              <span className="hidden sm:inline text-zinc-400 text-xs">Click image to toggle 2x zoom</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsZoomed((prev) => !prev)}
                className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title={isZoomed ? "Zoom out" : "Zoom in"}
              >
                {isZoomed ? (
                  <>
                    <ZoomOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset Zoom</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Zoom 2x</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                onClick={() => {
                  setIsZoomOpen(false);
                  setIsZoomed(false);
                }}
                aria-label="Close image preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Image Container */}
          <div
            className={cn(
              "relative flex-1 w-full flex items-center justify-center p-3 sm:p-6 overflow-hidden",
              isZoomed ? "overflow-auto cursor-grab active:cursor-grabbing p-4" : ""
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation Arrows inside Lightbox */}
            {screenshots.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-2xl active:scale-95 z-40"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-2xl active:scale-95 z-40"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <img
              src={screenshots[activeImgIndex]}
              alt="Full preview screenshot"
              onClick={() => setIsZoomed((prev) => !prev)}
              className={cn(
                "transition-all duration-300 origin-center object-contain max-h-[82vh] max-w-[92vw] rounded-lg shadow-2xl",
                isZoomed
                  ? "max-h-none max-w-none scale-150 sm:scale-175 cursor-zoom-out my-auto"
                  : "cursor-zoom-in hover:opacity-98"
              )}
            />
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {screenshots.length > 1 && (
            <div
              className="h-16 w-full border-t border-white/10 bg-black/60 px-4 flex items-center justify-center gap-2 overflow-x-auto z-30 shrink-0 scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {screenshots.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveImgIndex(idx);
                    setIsZoomed(false);
                  }}
                  className={cn(
                    "h-11 w-14 rounded-md border overflow-hidden shrink-0 transition-all cursor-pointer bg-black/40",
                    activeImgIndex === idx
                      ? "border-white ring-2 ring-white/50 scale-105"
                      : "border-white/20 hover:border-white/50 opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={url} alt="thumbnail" className="h-full w-full object-contain p-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

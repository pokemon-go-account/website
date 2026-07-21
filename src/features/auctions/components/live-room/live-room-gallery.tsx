"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LiveRoomGalleryProps {
  screenshots: string[];
  teamColors: Record<string, string>;
  team: string;
}

export function LiveRoomGallery({ screenshots, teamColors, team }: LiveRoomGalleryProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const nextImage = () => setActiveImgIndex((prev) => (prev + 1) % screenshots.length);
  const prevImage = () => setActiveImgIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);

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
            onClick={() => setIsZoomOpen(true)}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102 cursor-zoom-in"
          />

          {/* Left/Right Controls */}
          {screenshots.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-zinc-700/50 hover:border-zinc-650 transition-all cursor-pointer shadow-md"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-zinc-700/50 hover:border-zinc-650 transition-all cursor-pointer shadow-md"
              >
                <ChevronRight className="h-4.5 w-4.5" />
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
                onClick={() => setActiveImgIndex(idx)}
                className={cn(
                  "relative h-12 w-16 rounded-lg overflow-hidden border bg-zinc-50 dark:bg-zinc-900 shrink-0 transition-all cursor-pointer",
                  activeImgIndex === idx
                    ? "border-[#6133e1] ring-2 ring-[#6133e1]/30 scale-95"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Lightbox Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            onClick={() => setIsZoomOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {/* Navigation Controls in Zoom Modal if multiple screenshots */}
          {screenshots.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image Container */}
          <div
            className="relative max-w-[90vw] max-h-[85vh] overflow-auto flex items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={screenshots[activeImgIndex]}
              alt="Zoomed preview screenshot"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 hover:scale-110 cursor-zoom-out"
              onClick={() => setIsZoomOpen(false)}
            />
          </div>

          {/* Image index indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold">
            {activeImgIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </>
  );
}

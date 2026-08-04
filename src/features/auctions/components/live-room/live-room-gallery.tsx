"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { ImageZoomLightbox } from "@/components/ui/image-zoom-lightbox";

interface LiveRoomGalleryProps {
  screenshots: string[];
  teamColors: Record<string, string>;
  team: string;
}

export function LiveRoomGallery({ screenshots, teamColors, team }: LiveRoomGalleryProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const nextImage = useCallback(() => {
    setActiveImgIndex((prev) => (prev + 1) % screenshots.length);
  }, [screenshots.length]);

  const prevImage = useCallback(() => {
    setActiveImgIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  }, [screenshots.length]);

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-4 sm:p-5 space-y-4 shadow-xs relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-[#6133e1]/5 blur-2xl pointer-events-none" />

        {/* Main Viewer Container */}
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-zinc-50 dark:bg-black/20 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center group shadow-inner">

          {/* Team Tag & Verified Asset Badges */}
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

          {/* Interactive Zoom Overlay Badge */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1 shadow-lg backdrop-blur-md cursor-pointer"
          >
            <Maximize2 className="h-3 w-3" />
            <span>Interactive Zoom</span>
          </button>

          {/* Main Display Image */}
          <img
            src={screenshots[activeImgIndex]}
            alt="Account preview screenshot"
            onClick={() => setIsZoomOpen(true)}
            className="w-full h-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-102 cursor-zoom-in"
          />

          {/* Hover Hint Banner */}
          <div
            onClick={() => setIsZoomOpen(true)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-lg border border-white/10 cursor-pointer pointer-events-none"
          >
            Click to open 360° point zoom
          </div>

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
                onClick={() => setActiveImgIndex(idx)}
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

      {/* Interactive Lightbox Zoom Modal (Point-based Zoom & Touch/Mouse Pan) */}
      <ImageZoomLightbox
        images={screenshots}
        initialIndex={activeImgIndex}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        title="Pokémon GO Asset Verification Screenshots"
      />
    </>
  );
}

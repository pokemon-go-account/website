"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Maximize2,
} from "lucide-react";

interface ImageZoomLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function ImageZoomLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}: ImageZoomLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Sync initialIndex when changed
  useEffect(() => {
    setCurrentIndex(initialIndex);
    resetZoom();
  }, [initialIndex, isOpen]);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setOrigin({ x: 50, y: 50 });
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  const nextImage = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  }, [images.length, resetZoom]);

  const prevImage = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  }, [images.length, resetZoom]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "+" || e.key === "=") {
        setZoomLevel((prev) => Math.min(prev + 0.5, 4));
      } else if (e.key === "-") {
        setZoomLevel((prev) => {
          const next = Math.max(prev - 0.5, 1);
          if (next === 1) resetZoom();
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, prevImage, nextImage, resetZoom]);

  // Handle Point Zoom on Click / Tap
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    
    // If dragging happened, don't trigger click zoom toggle
    if (Math.abs(panOffset.x) > 5 || Math.abs(panOffset.y) > 5) {
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const clickY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (zoomLevel === 1) {
      setOrigin({ x: clickX, y: clickY });
      setZoomLevel(2.5);
      setPanOffset({ x: 0, y: 0 });
    } else if (zoomLevel < 3.5) {
      setOrigin({ x: clickX, y: clickY });
      setZoomLevel(3.5);
    } else {
      resetZoom();
    }
  };

  // Hover Panning on Mouse Move (Laptop / PC)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1 || isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    // Only pan if mouse is within or near image bounds
    if (
      e.clientX >= rect.left - 50 &&
      e.clientX <= rect.right + 50 &&
      e.clientY >= rect.top - 50 &&
      e.clientY <= rect.bottom + 50
    ) {
      const hoverX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const hoverY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setOrigin({ x: hoverX, y: hoverY });
    }
  };

  // Dragging / Touch Drag Handler Start
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  // Pointer Move Dragging
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || zoomLevel <= 1) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPanOffset({ x: newX, y: newY });
  };

  // Pointer Up Drag Stop
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Controls Header Bar */}
      <div
        className="relative h-14 w-full px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-md z-30 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Info Title & Counter */}
        <div className="flex items-center gap-3 text-white min-w-0 pr-2">
          <span className="bg-[#6133e1] text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider shrink-0">
            {currentIndex + 1} / {images.length}
          </span>
          {title ? (
            <h3 className="font-bold text-xs sm:text-sm text-white truncate max-w-xs sm:max-w-md">
              {title}
            </h3>
          ) : (
            <span className="hidden sm:inline text-zinc-400 text-xs font-medium">
              Click or move cursor to inspect any point
            </span>
          )}
        </div>

        {/* Right: Controls Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => {
              setZoomLevel((prev) => {
                const next = Math.max(prev - 0.5, 1);
                if (next === 1) resetZoom();
                return next;
              });
            }}
            disabled={zoomLevel <= 1}
            className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Zoom Level Badge / Reset */}
          <button
            type="button"
            onClick={() => {
              if (zoomLevel === 1) {
                setZoomLevel(2.5);
              } else {
                resetZoom();
              }
            }}
            className={cn(
              "h-8.5 px-2.5 sm:h-9 sm:px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
              zoomLevel > 1
                ? "bg-purple-600 text-white hover:bg-purple-500 shadow-md"
                : "bg-white/10 hover:bg-white/20 text-white"
            )}
            title="Toggle 2.5x Zoom"
          >
            {zoomLevel > 1 ? (
              <>
                <RotateCcw className="h-3 w-3" />
                <span>{zoomLevel.toFixed(1)}x</span>
              </>
            ) : (
              <>
                <ZoomIn className="h-3.5 w-3.5" />
                <span>Zoom</span>
              </>
            )}
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(prev + 0.5, 4))}
            disabled={zoomLevel >= 4}
            className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Close Button */}
          <button
            type="button"
            className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer ml-1"
            onClick={onClose}
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "relative flex-1 w-full flex items-center justify-center p-3 sm:p-6 overflow-hidden touch-none",
          zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Helper Hint Pill */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs text-zinc-300 border border-white/10 font-semibold shadow-lg flex items-center gap-1.5 opacity-90">
          <Move className="h-3 w-3 text-purple-400 animate-pulse" />
          <span>
            {zoomLevel > 1
              ? "Touch & drag or move cursor to inspect any point"
              : "Click or tap any point to zoom"}
          </span>
        </div>

        {/* Previous Image Button */}
        {images.length > 1 && (
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
        )}

        {/* Next Image Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="fixed right-3 sm:left-auto sm:right-6 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-2xl active:scale-95 z-40"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Main Image with Interactive Point Zoom & Pan */}
        <div className="relative max-h-[82vh] max-w-[92vw] flex items-center justify-center overflow-visible">
          <img
            ref={imageRef}
            src={images[currentIndex]}
            alt="Full size interactive asset preview"
            onClick={handleImageClick}
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transformOrigin: `${origin.x}% ${origin.y}%`,
              transition: isDragging ? "none" : "transform 0.18s ease-out, transform-origin 0.18s ease-out",
            }}
            className={cn(
              "object-contain max-h-[82vh] max-w-[92vw] rounded-lg shadow-2xl transition-shadow select-none",
              zoomLevel > 1 ? "cursor-grab active:cursor-grabbing shadow-purple-500/10" : "cursor-zoom-in"
            )}
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Thumbnail Navigation Bar */}
      {images.length > 1 && (
        <div
          className="h-16 w-full border-t border-white/10 bg-black/60 backdrop-blur-md px-4 flex items-center justify-center gap-2 overflow-x-auto z-30 shrink-0 scrollbar-none"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                resetZoom();
              }}
              className={cn(
                "h-11 w-14 rounded-md border overflow-hidden shrink-0 transition-all cursor-pointer bg-black/40",
                currentIndex === idx
                  ? "border-purple-500 ring-2 ring-purple-500/50 scale-105"
                  : "border-white/20 hover:border-white/50 opacity-60 hover:opacity-100"
              )}
            >
              <img src={url} alt="Thumbnail preview" className="h-full w-full object-contain p-0.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

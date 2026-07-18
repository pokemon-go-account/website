"use client";

import { Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  _id: string;
  username: string;
  comment: string;
  rating: number;
  createdAt: string;
}

interface FeedbackMarqueeProps {
  feedbacks: FeedbackItem[];
}

export function FeedbackMarquee({ feedbacks }: FeedbackMarqueeProps) {
  if (feedbacks.length === 0) return null;

  // Split feedbacks into two distinct sets
  const row1Unique = feedbacks.filter((_, idx) => idx % 2 === 0);
  const row2Unique = feedbacks.filter((_, idx) => idx % 2 !== 0);

  // Repeat each set for a seamless marquee loop
  const row1Items = [...row1Unique, ...row1Unique, ...row1Unique];
  const row2Items = [...row2Unique, ...row2Unique, ...row2Unique];

  // Helper for generating distinct avatar colors based on username
  const getAvatarColorClass = (username: string) => {
    const code = username.charCodeAt(0) % 5;
    const colors = [
      "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "bg-orange-500/10 text-orange-500 border-orange-500/20",
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      "bg-pink-500/10 text-pink-500 border-pink-500/20"
    ];
    return colors[code];
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3 w-3",
              star <= Math.round(rating)
                ? "fill-yellow-400 stroke-yellow-400"
                : "stroke-zinc-300 dark:stroke-zinc-700 fill-transparent"
            )}
          />
        ))}
      </div>
    );
  };

  const Card = ({ item }: { item: FeedbackItem }) => (
    <div className="w-[320px] shrink-0 mx-3 rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 select-none">
      <div className="space-y-3">
        {/* Upper row: User Avatar initials & rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("h-7 w-7 rounded-md border text-xs font-semibold flex items-center justify-center uppercase shadow-xs", getAvatarColorClass(item.username))}>
              {item.username.substring(0, 2)}
            </div>
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
              {item.username}
            </span>
          </div>
          {renderStars(item.rating)}
        </div>

        {/* Review text */}
        <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed italic font-normal">
          "{item.comment}"
        </p>
      </div>

      {/* Footer metadata */}
      <div className="pt-2.5 mt-3 border-t border-zinc-200 dark:border-white/[0.06] flex items-center justify-between text-[9px] text-zinc-600 dark:text-zinc-400 font-semibold">
        <span className="flex items-center gap-0.5 text-zinc-600 dark:text-zinc-350 uppercase tracking-wider">
          <Award className="h-3 w-3 text-emerald-500" /> Verified Trainer
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 w-full overflow-hidden py-4">
      {/* Styles for dynamic, performance-optimized infinite CSS marquees */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-to-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.3333%, 0, 0); }
        }
        @keyframes marquee-to-right {
          0% { transform: translate3d(-33.3333%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .scroller-left-track {
          animation: marquee-to-left 40s linear infinite;
        }
        .scroller-right-track {
          animation: marquee-to-right 40s linear infinite;
        }
        .scroller-left-track:hover, .scroller-right-track:hover {
          animation-play-state: paused;
        }
      `}} />

      {/* Header section */}
      <div className="text-center space-y-2 max-w-xl mx-auto px-4">
        <span className="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white text-[10px] font-semibold px-2.5 py-1 rounded-md">
          <Star className="h-3 w-3 fill-current text-zinc-900 dark:text-white" />
          Testimonials
        </span>
        <h2 className="text-zinc-900 dark:text-white font-semibold text-xl tracking-tight">
          Real Feedback from Real Trainers
        </h2>
        <p className="text-zinc-650 dark:text-zinc-350 text-xs font-normal">
          Hear what trainers worldwide say about our secure accounts, custom catching, and live auction trades.
        </p>
      </div>

      {/* Marquee Rows Container */}
      <div className="flex flex-col gap-6 relative">
        {/* Soft edge gradients overlay */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/50 to-transparent dark:from-[#09090B] dark:via-[#09090B]/50 dark:to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/50 to-transparent dark:from-[#09090B] dark:via-[#09090B]/50 dark:to-transparent z-10 pointer-events-none" />

        {/* Row 1: Leftward moving cards */}
        <div className="flex w-max">
          <div className="flex scroller-left-track">
            {row1Items.map((item, idx) => (
              <Card key={`r1-${item._id}-${idx}`} item={item} />
            ))}
          </div>
        </div>

        {/* Row 2: Rightward moving cards */}
        <div className="flex w-max">
          <div className="flex scroller-right-track">
            {row2Items.map((item, idx) => (
              <Card key={`r2-${item._id}-${idx}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

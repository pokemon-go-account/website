"use client";

import { useActionState, useEffect, useState } from "react";
import { submitFeedback } from "@/features/feedback/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackFormProps {
  initialFeedback?: {
    rating: number;
    comment: string;
  } | null;
}

export function FeedbackForm({ initialFeedback }: FeedbackFormProps) {
  const [state, formAction, isPending] = useActionState(submitFeedback, {
    success: false,
    error: null,
  } as any);

  const [rating, setRating] = useState<number>(initialFeedback ? initialFeedback.rating : 5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>(initialFeedback ? initialFeedback.comment : "");

  useEffect(() => {
    if (state.success && !initialFeedback) {
      setRating(5);
      setComment("");
    }
  }, [state.success, initialFeedback]);

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.01] backdrop-blur-md p-6 space-y-6 shadow-xl">
      <div className="space-y-1">
        <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
          {initialFeedback ? "Edit Your Review" : "Leave a Review"}
        </h3>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          Share your experience with our escrow catalog and recovery services.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {state.error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 leading-snug">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="rounded-xl bg-green-500/10 p-3 text-xs text-green-500 border border-green-500/20 leading-snug">
            {initialFeedback 
              ? "✅ Review updated successfully!" 
              : "✅ Feedback submitted successfully! Thank you for your review."}
          </div>
        )}

        {/* Rating Select */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Your Rating</Label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(null)}
                className="p-1 rounded transition-transform active:scale-95 cursor-pointer"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-all duration-150",
                    star <= (hoveredRating !== null ? hoveredRating : rating)
                      ? "fill-yellow-400 stroke-yellow-400 filter drop-shadow-[0_0_4px_rgba(250,204,21,0.4)]"
                      : "stroke-zinc-300 dark:stroke-zinc-700 fill-transparent"
                  )}
                />
              </button>
            ))}
          </div>
          <input type="hidden" name="rating" value={rating} />
        </div>

        {/* Comment Field */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Review Details
          </Label>
          <Textarea
            id="comment"
            name="comment"
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think of our service? Fast delivery? Helpful admins? Let others know!"
            className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] focus:border-zinc-300 dark:focus:border-white/[0.2] text-xs rounded-xl shadow-xs"
          />
          <div className="flex justify-between pl-1">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Min. 5 characters</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{comment.length} / 500</span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black shadow-md"
        >
          {isPending 
            ? (initialFeedback ? "Saving..." : "Submitting...") 
            : (initialFeedback ? "Save Changes" : "Submit Review")}
        </Button>
      </form>
    </div>
  );
}

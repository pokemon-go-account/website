"use client";

import { useState, useTransition } from "react";
import { submitOrderFeedback, editOrderFeedback, deleteOrderFeedback } from "@/features/feedback/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Edit3, Trash2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderReviewSectionProps {
  orderId: string;
  initialReview: {
    id: string;
    rating: number;
    comment: string;
  } | null;
}

export function OrderReviewSection({ orderId, initialReview }: OrderReviewSectionProps) {
  const [review, setReview] = useState(initialReview);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(initialReview?.rating || 5);
  const [comment, setComment] = useState(initialReview?.comment || "");
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (comment.trim().length < 5) {
      setError("Comment must be at least 5 characters long.");
      return;
    }

    startTransition(async () => {
      try {
        if (review) {
          // Edit existing review
          const res = await editOrderFeedback(review.id, rating, comment);
          if (res.success) {
            setReview({ id: review.id, rating, comment });
            setIsEditing(false);
            setSuccess("Review updated successfully!");
          } else {
            setError(res.error || "Failed to update review.");
          }
        } else {
          // Submit new review
          const res = await submitOrderFeedback(orderId, rating, comment);
          if (res.success) {
            // Need to reload to get the newly generated review ID or set a local dummy ID
            // Simple refresh or local update. For simplicity, reload or trigger updates
            window.location.reload();
          } else {
            setError(res.error || "Failed to submit review.");
          }
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  const handleDelete = () => {
    if (!review || !confirm("Are you sure you want to permanently delete this review?")) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await deleteOrderFeedback(review.id);
        if (res.success) {
          setReview(null);
          setComment("");
          setRating(5);
          setIsEditing(false);
          setSuccess("Review deleted successfully!");
        } else {
          setError(res.error || "Failed to delete review.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-white/[0.04] space-y-3">
      {/* Alert Notices */}
      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 flex gap-2 items-center">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex gap-2 items-center">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Review display state */}
      {review && !isEditing ? (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-zinc-50/50 dark:bg-white/[0.01] border border-zinc-200/50 dark:border-white/[0.03] p-3.5 rounded-xl">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Your Review:</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3 w-3",
                      star <= review.rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-zinc-300 dark:stroke-zinc-700 fill-transparent"
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-450 italic leading-relaxed">
              "{review.comment}"
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-start">
            <button
              onClick={() => setIsEditing(true)}
              className="h-7 px-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/5 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="h-7 px-2.5 rounded-lg bg-red-650/10 hover:bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      ) : isEditing || !review ? (
        isEditing || (review === null && !isEditing) ? (
          !isEditing && !review ? (
            <button
              onClick={() => setIsEditing(true)}
              className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-150 dark:hover:bg-white/5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              ★ Write a Review
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 bg-zinc-50/50 dark:bg-white/[0.01] border border-zinc-200/50 dark:border-white/[0.03] p-4 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                  {review ? "Edit Review" : "Submit Order Review"}
                </span>

                {/* Interactive Star Selector */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="cursor-pointer focus:outline-none transition-transform active:scale-125"
                    >
                      <Star
                        className={cn(
                          "h-5 w-5 transition-colors",
                          star <= (hoverRating !== null ? hoverRating : rating)
                            ? "fill-yellow-400 stroke-yellow-400 filter drop-shadow-[0_0_2px_rgba(250,204,21,0.2)]"
                            : "stroke-zinc-300 dark:stroke-zinc-700 fill-transparent"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={2}
                placeholder="Share your experience (account speed, stardust quality, support response, etc.)"
                className="bg-white dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.06] text-xs rounded-xl focus-visible:ring-indigo-500/20"
              />

              <div className="flex items-center gap-2 justify-end">
                {review && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError(null);
                    }}
                    className="h-8 px-3.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/5 text-xs font-semibold text-zinc-650 dark:text-zinc-350 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <Button
                  type="submit"
                  disabled={isPending || comment.trim().length < 5}
                  className="h-8 px-4 font-bold text-xs rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-sm"
                >
                  {isPending ? "Submitting..." : review ? "Update Review" : "Post Review"}
                </Button>
              </div>
            </form>
          )
        ) : null
      ) : null}
    </div>
  );
}

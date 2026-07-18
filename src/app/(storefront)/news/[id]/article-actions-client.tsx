"use client";

import { useState } from "react";
import { Share2, Copy, Check, Bookmark, ThumbsUp } from "lucide-react";

interface ArticleActionsClientProps {
  articleId: string;
  title: string;
}

export function ArticleActionsClient({ articleId, title }: ArticleActionsClientProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareTwitter = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Check out "${title}" on Pokémon GO Services`);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
    }
  };

  const handleShareFacebook = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLiked(!liked)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
          liked
            ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            : "bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        }`}
      >
        <ThumbsUp className={`h-3.5 w-3.5 ${liked ? "fill-rose-500" : ""}`} />
        <span>{liked ? "Liked" : "Helpful"}</span>
      </button>

      <button
        onClick={() => setBookmarked(!bookmarked)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
          bookmarked
            ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
            : "bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        }`}
      >
        <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-amber-500" : ""}`} />
        <span>{bookmarked ? "Saved" : "Save"}</span>
      </button>

      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 text-xs font-semibold cursor-pointer transition-all"
        title="Copy article link"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-bold">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      <button
        onClick={handleShareTwitter}
        className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-semibold hover:bg-sky-500/20 transition-all cursor-pointer"
      >
        <span>X / Twitter</span>
      </button>

      <button
        onClick={handleShareFacebook}
        className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-600/20 transition-all cursor-pointer"
      >
        <span>Facebook</span>
      </button>
    </div>
  );
}

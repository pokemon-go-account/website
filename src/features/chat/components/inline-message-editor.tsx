"use client";

import React, { useState, useRef, useEffect } from "react";
import { Loader2, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineMessageEditorProps {
  initialText: string;
  isOutgoing?: boolean;
  onSave: (newText: string) => Promise<void>;
  onCancel: () => void;
}

export function InlineMessageEditor({
  initialText,
  isOutgoing = false,
  onSave,
  onCancel,
}: InlineMessageEditorProps) {
  const [text, setText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus and place cursor at end of text on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, []);

  // Auto-adjust height based on content
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(Math.max(el.scrollHeight, 60), 200)}px`;
    }
  }, [text]);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSaving) return;
    if (trimmed === initialText.trim()) {
      onCancel();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(trimmed);
    } catch (err: any) {
      setError(err?.message || "Failed to save edit.");
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="w-full space-y-2 py-1 min-w-[220px] max-w-full">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          placeholder="Edit message..."
          className={cn(
            "w-full text-xs sm:text-sm p-3 rounded-xl outline-none resize-none leading-relaxed transition-colors shadow-inner",
            isOutgoing
              ? "bg-black/20 text-white placeholder-white/50 border border-white/30 focus:border-white focus:ring-1 focus:ring-white/50"
              : "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          )}
          style={{ minHeight: "60px" }}
        />
      </div>

      {error && (
        <div className="text-[11px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5 px-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className={cn(
          "text-[10px] font-medium hidden sm:inline-block",
          isOutgoing ? "text-white/70" : "text-zinc-400 dark:text-zinc-500"
        )}>
          Enter to save • Shift+Enter for newline • Esc to cancel
        </span>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1",
              isOutgoing
                ? "text-white/80 hover:text-white hover:bg-white/10"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !text.trim()}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs",
              isOutgoing
                ? "bg-white text-zinc-950 hover:bg-zinc-100"
                : "bg-violet-600 hover:bg-violet-500 text-white"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

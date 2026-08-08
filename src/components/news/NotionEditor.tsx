"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { uploadNewsBodyImageAction } from "@/features/news/actions";
import { cn } from "@/lib/utils";

export interface NotionEditorProps {
  initialContent?: string; // HTML string
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function NotionEditor({
  initialContent = "",
  onChange,
  editable = true,
  className,
}: NotionEditorProps) {
  const [mounted, setMounted] = useState(false);
  const isInitializedRef = useRef(false);
  const initialContentRef = useRef(initialContent);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "notion-editor-wrapper rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#111115] min-h-[380px] p-6 flex flex-col items-center justify-center text-xs text-zinc-400 dark:text-zinc-500",
          className
        )}
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#6133e1] border-t-transparent mb-2" />
        <span>Loading canvas editor...</span>
      </div>
    );
  }

  return (
    <NotionEditorClient
      initialContent={initialContent}
      onChange={onChange}
      editable={editable}
      className={className}
      isInitializedRef={isInitializedRef}
      initialContentRef={initialContentRef}
    />
  );
}

function NotionEditorClient({
  initialContent,
  onChange,
  editable,
  className,
  isInitializedRef,
  initialContentRef,
}: NotionEditorProps & {
  isInitializedRef: React.MutableRefObject<boolean>;
  initialContentRef: React.MutableRefObject<string>;
}) {
  // Initialize BlockNote editor instance with body image upload handler
  const editor = useCreateBlockNote({
    uploadFile: async (file: File) => {
      if (!file.type.startsWith("image/")) {
        throw new Error("Invalid file type. Please select a valid image file.");
      }
      if (file.size > 8 * 1024 * 1024) {
        throw new Error("Image size exceeds 8MB limit. Please upload an image smaller than 8MB.");
      }

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const res = await uploadNewsBodyImageAction(base64);
            if (res.success && res.url) {
              resolve(res.url);
            } else {
              reject(new Error(res.error || "Failed to upload image."));
            }
          } catch (err: any) {
            reject(new Error(err.message || "Failed to upload image."));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read image file."));
      });
    },
  });

  // Load initial HTML content into BlockNote document
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    async function loadHTML() {
      const htmlToLoad = initialContentRef.current;
      if (!htmlToLoad || !htmlToLoad.trim()) return;

      try {
        const blocks = await editor.tryParseHTMLToBlocks(htmlToLoad);
        if (blocks && blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks);
        }
      } catch (err) {
        console.error("[NotionEditor] Failed to parse initial HTML into blocks:", err);
      }
    }

    loadHTML();
  }, [editor]);

  // Handle document changes and export lossy HTML to parent
  const handleEditorChange = useCallback(async () => {
    if (!onChange) return;
    try {
      const html = await editor.blocksToHTMLLossy(editor.document);
      onChange(html);
    } catch (err) {
      console.error("[NotionEditor] Failed to serialize blocks to HTML:", err);
    }
  }, [editor, onChange]);

  return (
    <div
      className={cn(
        "notion-editor-wrapper rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#111115] overflow-hidden transition-colors",
        "[--bn-colors-editor-text:#18181b] dark:[--bn-colors-editor-text:#f4f4f5]",
        "[--bn-colors-editor-background:transparent]",
        "[--bn-colors-side-menu:#a1a1aa] dark:[--bn-colors-side-menu:#71717a]",
        "[--bn-colors-highlights-purple-background:#f3e8ff] dark:[--bn-colors-highlights-[#581c87]]",
        "[--bn-colors-brand:#6133e1] dark:[--bn-colors-brand:#a78bfa]",
        "[&_.bn-block-content[data-content-type='image']]:my-4",
        "[&_.bn-file-uploader]:bg-purple-500/10 [&_.bn-file-uploader]:border-purple-500/30 dark:[&_.bn-file-uploader]:bg-purple-500/15 [&_.bn-file-uploader]:rounded-xl [&_.bn-file-uploader]:p-4",
        "[&_.bn-image-caption]:text-xs [&_.bn-image-caption]:text-zinc-500 dark:[&_.bn-image-caption]:text-zinc-400 [&_.bn-image-caption]:mt-1.5 [&_.bn-image-caption]:italic",
        "[&_.bn-editor]:focus-visible:outline-none [&_.bn-editor]:focus-visible:ring-2 [&_.bn-editor]:focus-visible:ring-purple-500/30 [&_.bn-editor]:rounded-lg",
        className
      )}
    >
      <BlockNoteView
        editor={editor}
        onChange={handleEditorChange}
        editable={editable}
        theme="dark"
        className="min-h-[380px] py-4 px-2 sm:px-4 text-sm leading-relaxed"
      />
    </div>
  );
}

export default NotionEditor;

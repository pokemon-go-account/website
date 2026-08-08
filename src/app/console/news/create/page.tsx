"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getNewsArticleById,
  createNewsArticle,
  updateNewsArticle,
  uploadNewsImageAction,
} from "@/features/news/actions";
import dynamic from "next/dynamic";
import { ArticleInputData } from "@/features/news/types";

const NotionEditor = dynamic(
  () => import("@/components/news/NotionEditor").then((m) => m.NotionEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] w-full rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#111115] p-6 flex flex-col items-center justify-center text-xs text-zinc-400 dark:text-zinc-500 animate-pulse">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#6133e1] border-t-transparent mb-2" />
        Loading canvas editor...
      </div>
    ),
  }
);
import {
  ChevronLeft,
  ImagePlus,
  X,
  AlertTriangle,
  CheckCircle2,
  Check,
  RotateCcw,
  Eye,
  Send,
  Edit3,
  Columns,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

function NewsEditorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [loadingArticle, setLoadingArticle] = useState(Boolean(editId));
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [articleId, setArticleId] = useState("");
  const [category, setCategory] = useState<ArticleInputData["category"]>("Updates");
  const [coverImage, setCoverImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("Pokémon GO Services Team");
  const [authorRole, setAuthorRole] = useState("Official Announcement");
  const [authorAvatar, setAuthorAvatar] = useState(
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80"
  );
  const [readTime, setReadTime] = useState("3 min read");
  const [tagsInput, setTagsInput] = useState("Pokemon GO, Updates");
  const [featured, setFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywordsInput, setSeoKeywordsInput] = useState("");

  // Notion Layout Toggle: Right Sidebar Open/Closed
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Editor View Mode: "write" | "split" | "preview"
  const [viewMode, setViewMode] = useState<"write" | "split" | "preview">("write");

  // Autosave & Draft Restoration State
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [draftPrompt, setDraftPrompt] = useState<{ data: any; dateStr: string } | null>(null);

  const draftKey = `news_draft_${editId || "new"}`;

  // Calculate word count & auto estimate read time (strip HTML tags)
  const plainTextContent = content.replace(/<[^>]*>/g, " ").trim();
  const wordCount = plainTextContent ? plainTextContent.split(/\s+/).length : 0;
  
  useEffect(() => {
    const mins = Math.max(1, Math.ceil(wordCount / 200));
    setReadTime(`${mins} min read`);
  }, [wordCount]);

  // Check for local draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.title || parsed.content)) {
          const dateStr = parsed.savedAt ? new Date(parsed.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "recently";
          setDraftPrompt({ data: parsed, dateStr });
        }
      }
    } catch (e) {
      console.error("Failed to read draft from localStorage:", e);
    }
  }, [draftKey]);

  // Debounced Autosave to localStorage
  useEffect(() => {
    if (!title && !content && !excerpt) return;

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      try {
        const draftPayload = {
          title,
          articleId,
          category,
          coverImage,
          excerpt,
          content,
          authorName,
          authorRole,
          authorAvatar,
          readTime,
          tagsInput,
          featured,
          seoTitle,
          seoDescription,
          seoKeywordsInput,
          savedAt: Date.now(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draftPayload));
        setSaveStatus("saved");
      } catch (e) {
        console.error("Failed to save draft to localStorage:", e);
        setSaveStatus("idle");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    title, articleId, category, coverImage, excerpt, content,
    authorName, authorRole, authorAvatar, readTime, tagsInput,
    featured, seoTitle, seoDescription, seoKeywordsInput, draftKey
  ]);

  // Global Cmd/Ctrl + Enter shortcut to publish/save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmitForm(fakeEvent);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [title, excerpt, content, coverImage, editId]);

  const handleRestoreDraft = () => {
    if (!draftPrompt) return;
    const d = draftPrompt.data;
    if (d.title) setTitle(d.title);
    if (d.articleId) setArticleId(d.articleId);
    if (d.category) setCategory(d.category);
    if (d.coverImage) setCoverImage(d.coverImage);
    if (d.excerpt) setExcerpt(d.excerpt);
    if (d.content) setContent(d.content);
    if (d.authorName) setAuthorName(d.authorName);
    if (d.authorRole) setAuthorRole(d.authorRole);
    if (d.authorAvatar) setAuthorAvatar(d.authorAvatar);
    if (d.tagsInput) setTagsInput(d.tagsInput);
    if (typeof d.featured === "boolean") setFeatured(d.featured);
    if (d.seoTitle) setSeoTitle(d.seoTitle);
    if (d.seoDescription) setSeoDescription(d.seoDescription);
    if (d.seoKeywordsInput) setSeoKeywordsInput(d.seoKeywordsInput);
    setDraftPrompt(null);
  };

  // If editing, load article details
  useEffect(() => {
    if (!editId) return;

    async function loadArticle() {
      setLoadingArticle(true);
      setError(null);
      try {
        const article = await getNewsArticleById(editId as string);
        if (article) {
          setTitle(article.title);
          setArticleId(article.articleId);
          setCategory(article.category);
          setCoverImage(article.coverImage);
          setExcerpt(article.excerpt);
          setContent(article.content);
          setAuthorName(article.author?.name || "Pokémon GO Services Team");
          setAuthorRole(article.author?.role || "Official Announcement");
          setAuthorAvatar(article.author?.avatar || "");
          setReadTime(article.readTime || "3 min read");
          setTagsInput(article.tags ? article.tags.join(", ") : "");
          setFeatured(Boolean(article.featured));
          setSeoTitle(article.seoTitle || article.title);
          setSeoDescription(article.seoDescription || article.excerpt);
          setSeoKeywordsInput(article.seoKeywords ? article.seoKeywords.join(", ") : "");
        } else {
          setError("Article not found for editing.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load article details.");
      }
      setLoadingArticle(false);
    }

    loadArticle();
  }, [editId]);

  const autoSlugify = (val: string) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!editId) {
      setArticleId(autoSlugify(newTitle));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB limit. Please upload an image smaller than 5MB.");
      return;
    }

    setUploadingImage(true);
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await uploadNewsImageAction(base64);
      if (res.success && res.url) {
        setCoverImage(res.url);
      } else {
        setError(res.error || "Failed to upload image. You can also paste a direct image URL.");
      }
      setUploadingImage(false);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
      setUploadingImage(false);
    };
  };

  // Pre-built Starter Templates (HTML strings)
  const applyTemplate = (templateType: "event" | "announcement" | "guide") => {
    if (content.trim().length > 0 && !confirm("Append template to document?")) {
      return;
    }

    let templateHTML = "";
    if (templateType === "event") {
      templateHTML = `<h1>🌟 Event Overview & Spawn Details</h1><p>The upcoming event introduces exclusive Pokémon encounters with boosted shiny odds!</p><hr /><h2>🗡️ Recommended Raid Counters & Teams</h2><ul><li><strong>Primal Groudon</strong>: Mud Shot + Precipice Blades</li><li><strong>Mega Rayquaza</strong>: Dragon Tail + Dragon Ascent</li><li><strong>Shadow Mewtwo</strong>: Psycho Cut + Psystrike</li></ul>> 💡 <strong>Pro-Tip</strong>: Activate Mega Evolutions that match the raid boss type to receive Bonus XL Candies!<hr /><h2>🏆 Exclusive Movesets & PvP Meta Breakdown</h2>`;
    } else if (templateType === "announcement") {
      templateHTML = `<h1>🚀 Platform Update & Release Notes</h1><p>We are excited to unveil new platform enhancements engineered for high performance!</p><hr /><h2>⚡ Key Improvements</h2><ol><li><strong>Sub-Millisecond Live Updates</strong>: Instant bidding response.</li><li><strong>Enhanced Credential Handover</strong>: Automated verification checks.</li><li><strong>24/7 Priority Support</strong>: Instant ticket resolution.</li></ol><hr /><h2>🛡️ Buyer Safeguards & Guarantees</h2><ul><li><strong>100% Buyer Protection</strong> on every purchase.</li><li><strong>Instant Account Handover</strong> with full email unlinking.</li></ul>`;
    } else if (templateType === "guide") {
      templateHTML = `<h1>📘 How to Maximize Account Valuation</h1><p>Key account metrics that determine auction value:</p><hr /><h2>📊 Account Metrics Checklist</h2><p>Inspect Stardust reserves (5M+), Level 50 Shadow Hundos (3+), and Shiny Mythicals (Mew/Jirachi).</p>`;
    }

    setContent((prev) => prev + templateHTML);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    if (!title || !excerpt || !content || !coverImage) {
      setError("Please fill in required fields (Title, Cover Image, Excerpt, Content).");
      setSubmitting(false);
      return;
    }

    const tagsArray = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const keywordsArray = seoKeywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload: ArticleInputData = {
      articleId: articleId.trim() || autoSlugify(title),
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category,
      coverImage: coverImage.trim(),
      authorName,
      authorRole,
      authorAvatar,
      readTime,
      tags: tagsArray,
      featured,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || excerpt,
      seoKeywords: keywordsArray.length ? keywordsArray : tagsArray,
    };

    let res;
    if (editId) {
      res = await updateNewsArticle(editId, payload);
    } else {
      res = await createNewsArticle(payload);
    }

    if (res?.success) {
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {}

      setSuccessMsg(
        editId
          ? `Article updated successfully!`
          : `Article published successfully!`
      );
      setTimeout(() => {
        router.push("/console/news");
      }, 1200);
    } else {
      setError(res?.error || "Failed to save news article.");
    }
    setSubmitting(false);
  };

  if (loadingArticle) {
    return (
      <div className="flex items-center justify-center py-24 text-xs text-zinc-500 font-medium">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mr-2" />
        Opening document canvas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0C0C0E] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans -m-6 sm:-m-10 p-4 sm:p-8">
      
      {/* 1. NOTION TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0C0C0E]/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/[0.08] px-4 py-3 flex items-center justify-between gap-4 rounded-xl mb-6">
        
        {/* Left: Breadcrumbs & Status */}
        <div className="flex items-center gap-3">
          <Link
            href="/console/news"
            className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors"
            title="Back to News Console"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">News Console</span>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span className="font-semibold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
              {title || "Untitled Document"}
            </span>
          </div>
          <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-purple-500/10 text-[#a78bfa] border border-purple-500/20 text-[10px] font-bold">
            {editId ? "Editing" : "Draft"}
          </span>
        </div>

        {/* Right: Metrics, Autosave Status, View Modes, Settings & Publish */}
        <div className="flex items-center gap-2.5">
          {/* Word Count & Autosave indicator */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-zinc-400 font-medium px-2">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{readTime}</span>
            {saveStatus === "saving" && (
              <>
                <span>•</span>
                <span className="text-amber-400 flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping mr-0.5" />
                  Saving...
                </span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              </>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-white/5 p-0.5 rounded-lg border border-zinc-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("write")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "write" ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              )}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Write</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "split" ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              )}
            >
              <Columns className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "preview" ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          {/* Toggle Metadata Sidebar */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
              sidebarOpen
                ? "bg-purple-500/10 border-purple-500/30 text-[#a78bfa]"
                : "border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            )}
            title="Document Settings & SEO"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Publish Action Button */}
          <button
            onClick={handleSubmitForm}
            disabled={submitting || uploadingImage}
            className="h-8 px-4 rounded-lg bg-[#6133e1] hover:bg-[#5229c7] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-60 shrink-0"
          >
            {submitting ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>{editId ? "Save" : "Publish"}</span>
          </button>
        </div>
      </header>

      {/* ALERTS */}
      {draftPrompt && (
        <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-xs text-purple-300 flex items-center justify-between gap-3 max-w-7xl mx-auto w-full backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-[#a78bfa] shrink-0" />
            <span>
              An unsaved local draft from <strong>{draftPrompt.dateStr}</strong> was found for this document.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1 rounded-lg bg-[#6133e1] hover:bg-[#5229c7] text-white font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Restore Draft
            </button>
            <button
              type="button"
              onClick={() => setDraftPrompt(null)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5 max-w-5xl mx-auto w-full">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5 max-w-5xl mx-auto w-full">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMsg} Redirecting...</span>
        </div>
      )}

      {/* 2. MAIN DOCUMENT WORKSPACE CONTAINER */}
      <div className="flex-1 flex gap-6 max-w-7xl mx-auto w-full">
        
        {/* NOTION DOCUMENT CANVAS (CENTER STAGE) */}
        <main className="flex-1 bg-white dark:bg-[#111115] rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs overflow-hidden flex flex-col">
          
          {/* NOTION COVER HERO BANNER */}
          <div className="relative group">
            {coverImage ? (
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-zinc-900">
                <img src={coverImage} alt="Document cover" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="h-8 px-3 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors backdrop-blur-xs">
                    <ImagePlus className="h-3.5 w-3.5" /> Change Cover Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="h-8 px-3 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors backdrop-blur-xs"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-8 pt-8 pb-2">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-purple-400 transition-colors cursor-pointer">
                  <ImagePlus className="h-4 w-4 text-[#6133e1]" />
                  <span>{uploadingImage ? "Uploading cover..." : "🖼️ Add Cover Banner Image"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* NOTION STICKY TEMPLATE TOOLBAR */}
          <div className="sticky top-[57px] z-30 bg-white/95 dark:bg-[#111115]/95 backdrop-blur-sm border-b border-zinc-100 dark:border-white/[0.06] px-6 sm:px-10 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="font-bold text-[#6133e1] dark:text-[#a78bfa] uppercase mr-1">Quick Templates:</span>
              <button
                type="button"
                onClick={() => applyTemplate("event")}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-[#a78bfa] border border-purple-500/20 font-bold transition-all cursor-pointer"
              >
                + Game Event
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("announcement")}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold transition-all cursor-pointer"
              >
                + Update
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("guide")}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold transition-all cursor-pointer"
              >
                + Strategy Guide
              </button>
            </div>
          </div>

          {/* NOTION CANVAS BODY */}
          <div className="p-6 sm:p-10 flex-1 flex flex-col space-y-6">
            
            {/* Seamless Title Input */}
            <input
              type="text"
              required
              placeholder="Article Title..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-transparent text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none tracking-tight border-b border-transparent focus:border-purple-500/30 pb-2 transition-all"
            />

            {/* Seamless Subtitle / Excerpt Input */}
            <textarea
              rows={2}
              required
              placeholder="Add a brief summary or subtitle..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-base font-normal text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none resize-none leading-relaxed"
            />

            <div className="border-b border-zinc-100 dark:border-white/[0.06]" />

            {/* EDITOR VIEW MODES */}
            {viewMode === "write" && (
              <NotionEditor initialContent={content} onChange={setContent} />
            )}

            {viewMode === "split" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <NotionEditor initialContent={content} onChange={setContent} />

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#14131b] overflow-y-auto max-h-[500px] space-y-3 text-xs leading-relaxed">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Live HTML Render Preview:</p>
                  <div
                    className="prose prose-zinc dark:prose-invert max-w-none text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </div>
            )}

            {viewMode === "preview" && (
              <div className="p-6 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#14131c] space-y-4 flex-1">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Public Reader Preview</span>
                  <span className="text-xs text-zinc-500">{readTime}</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white">{title || "Untitled Article"}</h1>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">{excerpt}</p>
                {coverImage && (
                  <div className="h-64 w-full rounded-xl overflow-hidden relative border border-zinc-200 dark:border-white/10">
                    <img src={coverImage} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
                <div
                  className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 pt-4 border-t border-zinc-200 dark:border-white/[0.06]"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            )}

          </div>

        </main>

        {/* 3. NOTION DOCUMENT METADATA SIDEBAR */}
        {sidebarOpen && (
          <aside className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#111115] shadow-xs space-y-5">
              
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.06] pb-3">
                <h3 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-purple-400" /> Document Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                  Category Directory
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#161520] border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white font-semibold text-xs cursor-pointer focus:outline-none focus:border-[#6133e1]"
                >
                  <option value="Updates">Updates</option>
                  <option value="Guides & Events">Guides & Events</option>
                  <option value="Marketplace">Marketplace</option>
                  <option value="Security">Security</option>
                  <option value="Community">Community</option>
                </select>
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                  URL Path / Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="pokemon-go-update"
                  value={articleId}
                  onChange={(e) => setArticleId(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#6133e1]"
                />
                <p className="text-[10px] text-zinc-400 truncate">
                  Path: <span className="text-[#6133e1] font-mono">/news/{articleId || "slug"}</span>
                </p>
              </div>

              {/* Featured Toggle */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#161520] flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-zinc-900 dark:text-white">Featured Story</p>
                  <p className="text-[10px] text-zinc-400">Pin to top of news feed</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6133e1]" />
                </label>
              </div>

              {/* Cover Image Direct URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-[#6133e1]"
                />
              </div>

              {/* Author Info */}
              <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
                <p className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider">Author Profile</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Author Name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Author Role"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              {/* SEO Tags & Keywords */}
              <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
                <p className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider">SEO & Tags</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Target SEO Keywords"
                    value={seoKeywordsInput}
                    onChange={(e) => setSeoKeywordsInput(e.target.value)}
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white text-xs"
                  />
                </div>
              </div>

            </div>
          </aside>
        )}

      </div>

    </div>
  );
}

export default function CreateNewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-zinc-500">Opening document canvas...</div>}>
      <NewsEditorForm />
    </Suspense>
  );
}

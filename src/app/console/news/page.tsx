"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAllNewsArticles,
  createNewsArticle,
  updateNewsArticle,
  deleteNewsArticle,
  uploadNewsImageAction,
} from "@/features/news/actions";
import { ArticleData, ArticleInputData } from "@/features/news/types";
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  ImagePlus,
  Eye,
  ExternalLink,
  Sparkles,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConsoleNewsManagementPage() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
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
  const [readTime, setReadTime] = useState("5 min read");
  const [tagsInput, setTagsInput] = useState("Pokemon GO, Updates");
  const [featured, setFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywordsInput, setSeoKeywordsInput] = useState("");

  // Editor Preview Tab
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllNewsArticles();
      setArticles(data);
    } catch (err: any) {
      setError(err.message || "Failed to load news articles.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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
    if (modalMode === "add") {
      setArticleId(autoSlugify(newTitle));
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedArticleId(null);
    setTitle("");
    setArticleId("");
    setCategory("Updates");
    setCoverImage("");
    setExcerpt("");
    setContent(`# Welcome to the Official Update\n\nWrite your announcement or event strategy guide here...\n\n- Bullet point 1\n- Bullet point 2`);
    setAuthorName("Pokémon GO Services Team");
    setAuthorRole("Official Announcement");
    setAuthorAvatar("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80");
    setReadTime("5 min read");
    setTagsInput("Pokemon GO, Updates, Auctions");
    setFeatured(false);
    setSeoTitle("");
    setSeoDescription("");
    setSeoKeywordsInput("");
    setActiveTab("write");
    setIsModalOpen(true);
  };

  const openEditModal = (article: ArticleData) => {
    setModalMode("edit");
    setSelectedArticleId(article.articleId);
    setTitle(article.title);
    setArticleId(article.articleId);
    setCategory(article.category);
    setCoverImage(article.coverImage);
    setExcerpt(article.excerpt);
    setContent(article.content);
    setAuthorName(article.author?.name || "Pokémon GO Services Team");
    setAuthorRole(article.author?.role || "Official Announcement");
    setAuthorAvatar(article.author?.avatar || "");
    setReadTime(article.readTime || "5 min read");
    setTagsInput(article.tags ? article.tags.join(", ") : "");
    setFeatured(Boolean(article.featured));
    setSeoTitle(article.seoTitle || article.title);
    setSeoDescription(article.seoDescription || article.excerpt);
    setSeoKeywordsInput(article.seoKeywords ? article.seoKeywords.join(", ") : "");
    setActiveTab("write");
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        setError(res.error || "Failed to upload image. Please try again or use a direct URL.");
      }
      setUploadingImage(false);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
      setUploadingImage(false);
    };
  };

  const insertContentTemplate = (prefix: string, suffix: string = "") => {
    setContent((prev) => prev + `\n${prefix}Sample Text${suffix}`);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

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
    if (modalMode === "add") {
      res = await createNewsArticle(payload);
    } else if (modalMode === "edit" && selectedArticleId) {
      res = await updateNewsArticle(selectedArticleId, payload);
    }

    if (res?.success) {
      setSuccessMsg(
        modalMode === "add"
          ? `Article "${title}" published successfully!`
          : `Article updated successfully!`
      );
      setIsModalOpen(false);
      loadData();
    } else {
      setError(res?.error || "Failed to save news article.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (article: ArticleData) => {
    if (!confirm(`Are you sure you want to delete article "${article.title}"?`)) return;

    setLoading(true);
    setError(null);
    const res = await deleteNewsArticle(article.articleId);
    if (res.success) {
      setSuccessMsg(`Article deleted.`);
      loadData();
    } else {
      setError(res.error || "Failed to delete article.");
      setLoading(false);
    }
  };

  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-[#6133e1]" />
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              Manage News & Event Updates
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Publish official announcements, event strategy guides, and SEO article posts.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="h-9 px-4 rounded-lg bg-[#6133e1] hover:bg-[#5229c7] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" /> Post New Article
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111116] space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Publications</p>
          <p className="text-2xl font-black">{articles.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111116] space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Article Reads</p>
          <p className="text-2xl font-black text-emerald-500">{totalViews.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111116] space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Featured Story</p>
          <p className="text-xs font-bold truncate text-[#6133e1] dark:text-purple-400">
            {articles.find((a) => a.featured)?.title || "None Selected"}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-650 dark:text-red-400 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Articles Table */}
      <div className="border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111116] rounded-xl overflow-x-auto shadow-xs">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/[0.06] text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Cover</th>
              <th className="px-6 py-4">Article Details & SEO ID</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Published</th>
              <th className="px-6 py-4">Views</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.05] text-zinc-700 dark:text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 italic">
                  Loading news publications...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 italic">
                  No news articles posted yet. Click "Post New Article" to publish your first update.
                </td>
              </tr>
            ) : (
              articles.map((art) => (
                <tr key={art.articleId} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <div className="h-12 w-20 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 relative shrink-0">
                      <img src={art.coverImage} alt={art.title} className="h-full w-full object-cover" />
                    </div>
                  </td>

                  <td className="px-6 py-4 max-w-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-950 dark:text-white line-clamp-1">
                        {art.title}
                      </span>
                      {art.featured && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-extrabold uppercase">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-zinc-400 truncate">
                      ID: /news/{art.articleId}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-[#6133e1]/10 text-[#6133e1] dark:text-[#a78bfa] border border-[#6133e1]/20 font-bold text-[10px]">
                      {art.category}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-[11px] text-zinc-500">
                    {new Date(art.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-6 py-4 font-bold text-emerald-500 text-xs">
                    {art.views || 0}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Link
                        href={`/news/${art.articleId}`}
                        target="_blank"
                        className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors"
                        title="View Public Page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        onClick={() => openEditModal(art)}
                        className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                        title="Edit Article"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(art)}
                        className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/5 flex items-center justify-center cursor-pointer transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Post / Edit Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-xs overflow-y-auto py-10">
          <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#09090B] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-[#6133e1]" />
                <h3 className="font-bold text-base text-zinc-950 dark:text-white">
                  {modalMode === "add" ? "Post New Article & Update" : "Edit Article"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5 text-xs">
              {/* Title & Article ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pokémon GO Wild Area 2026 Strategy Guide"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full h-9 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#6133e1] font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    SEO Article ID / Slug (URL Path) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pokemon-go-wild-area-2026-guide"
                    value={articleId}
                    onChange={(e) => setArticleId(e.target.value)}
                    className="w-full h-9 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#6133e1] font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-zinc-400">
                    URL: <span className="text-[#6133e1]">/news/{articleId || "your-slug"}</span>
                  </p>
                </div>
              </div>

              {/* Category & Featured Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#111116] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#6133e1] font-semibold cursor-pointer"
                  >
                    <option value="Updates">Updates</option>
                    <option value="Guides & Events">Guides & Events</option>
                    <option value="Marketplace">Marketplace</option>
                    <option value="Security">Security</option>
                    <option value="Community">Community</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4 sm:pt-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6133e1]" />
                  </label>
                  <span className="font-bold text-xs">Set as Featured Hero Story</span>
                </div>
              </div>

              {/* Image Upload / URL */}
              <div className="space-y-2">
                <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                  Cover Image * (Upload or Enter URL)
                </label>

                {coverImage && (
                  <div className="relative h-44 w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-900">
                    <img src={coverImage} alt="Cover preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex h-9 rounded-lg border border-dashed border-zinc-300 dark:border-white/20 hover:border-[#6133e1] bg-zinc-50 dark:bg-white/[0.02] items-center justify-center gap-2 cursor-pointer transition-colors">
                    <ImagePlus className="h-4 w-4 text-[#6133e1]" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {uploadingImage ? "Uploading..." : "Upload Image File"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    placeholder="Or paste direct image URL (https://...)"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="h-9 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#6133e1]"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                  Article Excerpt / Summary *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Short 2-3 sentence overview that appears on news cards and search metadata..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full p-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#6133e1]"
                />
              </div>

              {/* Article Content Markdown Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    Article Main Body (Markdown Supported) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("write")}
                      className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                        activeTab === "write"
                          ? "bg-[#6133e1] text-white"
                          : "bg-zinc-100 dark:bg-white/5 text-zinc-400"
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                        activeTab === "preview"
                          ? "bg-[#6133e1] text-white"
                          : "bg-zinc-100 dark:bg-white/5 text-zinc-400"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {/* Insertion toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => insertContentTemplate("## ")}
                    className="px-2 py-1 rounded bg-white dark:bg-zinc-800 text-[10px] font-bold border border-zinc-200 dark:border-white/10 hover:border-[#6133e1]"
                  >
                    + H2 Heading
                  </button>
                  <button
                    type="button"
                    onClick={() => insertContentTemplate("> ")}
                    className="px-2 py-1 rounded bg-white dark:bg-zinc-800 text-[10px] font-bold border border-zinc-200 dark:border-white/10 hover:border-[#6133e1]"
                  >
                    + Quote Callout
                  </button>
                  <button
                    type="button"
                    onClick={() => insertContentTemplate("- ")}
                    className="px-2 py-1 rounded bg-white dark:bg-zinc-800 text-[10px] font-bold border border-zinc-200 dark:border-white/10 hover:border-[#6133e1]"
                  >
                    + Bullet List
                  </button>
                  <button
                    type="button"
                    onClick={() => insertContentTemplate("![Image Description](", ")")}
                    className="px-2 py-1 rounded bg-white dark:bg-zinc-800 text-[10px] font-bold border border-zinc-200 dark:border-white/10 hover:border-[#6133e1]"
                  >
                    + Insert Image URL
                  </button>
                </div>

                {activeTab === "write" ? (
                  <textarea
                    required
                    rows={8}
                    placeholder="Write your article content using markdown headings, lists, quotes, and images..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-4 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#6133e1] font-mono text-xs leading-relaxed"
                  />
                ) : (
                  <div className="p-4 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#111116] min-h-[200px] space-y-3">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Live Content Render Preview:</p>
                    <div className="prose prose-zinc dark:prose-invert max-w-none text-xs">
                      {content.split("\n\n").map((b, i) => (
                        <p key={i}>{b}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Author & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    Author Role
                  </label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Tags & SEO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    Article Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Wild Area, Shiny Odds, Raids"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    SEO Target Keywords
                  </label>
                  <input
                    type="text"
                    placeholder="Pokemon GO News, Wild Area 2026"
                    value={seoKeywordsInput}
                    onChange={(e) => setSeoKeywordsInput(e.target.value)}
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="w-full h-10 rounded-xl bg-[#6133e1] hover:bg-[#5229c7] text-white font-bold text-xs transition-all shadow-md active:scale-98 disabled:opacity-60 cursor-pointer mt-4"
              >
                {submitting
                  ? "Publishing..."
                  : modalMode === "add"
                  ? "Publish News Article"
                  : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getCategories, createCategory, updateCategory, deleteCategory, uploadCategoryImageAction } from "@/features/admin/actions";
import { FolderTree, Plus, Pencil, Trash2, X, AlertTriangle, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

// Zod Validation Schema
const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  imageUrl: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const watchedImageUrl = watch("imageUrl");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const res = await getCategories();
    if (res.success && res.categories) {
      setCategories(res.categories);
    } else {
      setError(res.error || "Failed to load categories.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedCategory(null);
    setPreviewImageUrl("");
    reset({ name: "", slug: "", imageUrl: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setModalMode("edit");
    setSelectedCategory(category);
    setPreviewImageUrl(category.imageUrl || "");
    reset({ name: category.name, slug: category.slug, imageUrl: category.imageUrl || "" });
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
      const res = await uploadCategoryImageAction(base64);
      if (res.success && res.url) {
        setValue("imageUrl", res.url);
        setPreviewImageUrl(res.url);
      } else {
        setError(res.error || "Failed to upload image. Make sure Cloudinary keys are configured.");
      }
      setUploadingImage(false);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
      setUploadingImage(false);
    };
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setSubmitting(true);
    setError(null);
    
    let res;
    if (modalMode === "add") {
      res = await createCategory(values.name, values.slug, values.imageUrl);
    } else if (modalMode === "edit" && selectedCategory) {
      res = await updateCategory(selectedCategory._id, values.name, values.slug, values.imageUrl);
    }

    if (res?.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      setError(res?.error || "Failed to save category. Slug might already exist.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) return;
    
    setLoading(true);
    setError(null);
    const res = await deleteCategory(category._id);
    
    if (res.success) {
      loadData();
    } else {
      setError(res.error || "Failed to delete category.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Manage Categories</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Create and organize storefront service directories.</p>
        </div>

        <button
          onClick={openAddModal}
          className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-650 dark:text-red-400 flex items-start gap-2 max-w-2xl leading-normal">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Execution Error:</span> {error}
          </div>
        </div>
      )}

      {/* Main categories listing table */}
      <div className="border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] rounded-lg overflow-x-auto shadow-xs">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/[0.06] text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Directory Slug</th>
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.05] text-zinc-700 dark:text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 italic">
                  Loading categories directory logs...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 italic">
                  No categories defined. Click "Add Category" to get started.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-950 dark:text-white">{cat.name}</td>
                  <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">{cat.slug}</td>
                  <td className="px-6 py-4">
                    {cat.imageUrl ? (
                      <div className="h-9 w-14 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.05] bg-zinc-100 dark:bg-zinc-900">
                        <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-600 text-[10px] italic">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="h-8 w-8 rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-white/[0.08] dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Category"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/5 flex items-center justify-center cursor-pointer transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CRUD Add/Edit Glass Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 dark:bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#09090B] p-6 shadow-2xl space-y-4 transition-all">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-3">
              <h3 className="font-semibold text-sm text-zinc-950 dark:text-white">
                {modalMode === "add" ? "Create Category Directory" : "Update Category Directory"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-7 w-7 rounded-md border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g., Rare Items, Accounts Level 40"
                  {...register("name")}
                  className={cn(
                    "w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-900 dark:text-white placeholder:text-zinc-405 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors",
                    errors.name && "border-red-500/50 focus:border-red-500"
                  )}
                />
                {errors.name && <p className="text-[10px] text-red-400 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">URL Slug</label>
                <input
                  type="text"
                  placeholder="e.g., rare-items, accounts-lvl-40"
                  {...register("slug")}
                  className={cn(
                    "w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-900 dark:text-white placeholder:text-zinc-405 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors font-mono text-[11px]",
                    errors.slug && "border-red-500/50 focus:border-red-500"
                  )}
                />
                {errors.slug && <p className="text-[10px] text-red-400 font-semibold">{errors.slug.message}</p>}
              </div>

              {/* Category Image Upload */}
              <div className="space-y-2">
                <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Category Image</label>

                {/* Preview */}
                {(previewImageUrl || watchedImageUrl) && (
                  <div className="relative h-28 w-full rounded-md overflow-hidden border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-zinc-900">
                    <img
                      src={previewImageUrl || watchedImageUrl}
                      alt="Category preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => { setValue("imageUrl", ""); setPreviewImageUrl(""); }}
                      className="absolute top-2 right-2 h-6 w-6 rounded-md bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <label className="flex h-8 rounded-md border border-dashed border-zinc-200 dark:border-white/[0.1] hover:border-zinc-400 dark:hover:border-white/[0.2] bg-zinc-50 hover:bg-zinc-100 dark:bg-white/[0.01] dark:hover:bg-white/[0.03] items-center justify-center gap-2 cursor-pointer transition-colors">
                  <ImagePlus className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-[10px] font-semibold text-zinc-500">
                    {uploadingImage ? "Uploading to Cloudinary..." : "Choose Image File"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>

                <div className="space-y-1">
                  <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold">Or enter direct URL</p>
                  <input
                    type="text"
                    placeholder="https://..."
                    {...register("imageUrl")}
                    onChange={(e) => { setValue("imageUrl", e.target.value); setPreviewImageUrl(e.target.value); }}
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-900 dark:text-white placeholder:text-zinc-405 dark:placeholder:text-zinc-650 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors text-[11px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="w-full h-8 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition-all mt-4 disabled:opacity-60"
              >
                {submitting ? "Saving changes..." : modalMode === "add" ? "Create Category" : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

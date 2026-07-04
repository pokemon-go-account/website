"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/features/admin/actions";
import { FolderTree, Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Zod Validation Schema
const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  _id: string;
  name: string;
  slug: string;
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

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

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
    reset({ name: "", slug: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setModalMode("edit");
    setSelectedCategory(category);
    reset({ name: category.name, slug: category.slug });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setSubmitting(true);
    setError(null);
    
    let res;
    if (modalMode === "add") {
      res = await createCategory(values.name, values.slug);
    } else if (modalMode === "edit" && selectedCategory) {
      res = await updateCategory(selectedCategory._id, values.name, values.slug);
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
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.05] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.05] flex items-center justify-center">
            <FolderTree className="h-4.5 w-4.5 text-zinc-555 dark:text-zinc-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white">Manage Categories</h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">Create and organize services storefront directories</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-650 dark:text-red-400 flex items-start gap-2 max-w-2xl leading-normal">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Execution Error:</span> {error}
          </div>
        </div>
      )}

      {/* Main categories listing table */}
      <div className="border border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-zinc-950/40 rounded-2xl overflow-hidden backdrop-blur-md shadow-xs">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/[0.05] text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Category Name</th>
              <th className="px-6 py-4">Directory Slug</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.05] text-zinc-700 dark:text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-500 italic">
                  Loading categories directory logs...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-500 italic">
                  No categories defined. Click "Add Category" to get started.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-950 dark:text-white">{cat.name}</td>
                  <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">{cat.slug}</td>
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
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.05] pb-3">
              <h3 className="font-extrabold text-sm text-zinc-950 dark:text-white">
                {modalMode === "add" ? "Create Category Directory" : "Update Category Directory"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-7 w-7 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g., Rare Items, Accounts Level 40"
                  {...register("name")}
                  className={cn(
                    "w-full h-9 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors",
                    errors.name && "border-red-500/50 focus:border-red-500"
                  )}
                />
                {errors.name && <p className="text-[10px] text-red-400 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">URL Slug</label>
                <input
                  type="text"
                  placeholder="e.g., rare-items, accounts-lvl-40"
                  {...register("slug")}
                  className={cn(
                    "w-full h-9 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors font-mono text-[11px]",
                    errors.slug && "border-red-500/50 focus:border-red-500"
                  )}
                />
                {errors.slug && <p className="text-[10px] text-red-400 font-semibold">{errors.slug.message}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-extrabold text-xs shadow-lg active:scale-95 transition-all mt-4"
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

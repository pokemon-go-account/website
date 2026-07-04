"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, uploadProductImageAction } from "@/features/admin/actions";
import { Package2, Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Zod Validation Schema
const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().positive("Price must be a positive number"),
  categoryId: z.string().min(1, "Please select a category"),
  imageUrl: z.string().min(1, "Image URL is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  categoryId?: Category;
}

export default function ManageProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await uploadProductImageAction(base64);
      if (res.success && res.url) {
        setValue("imageUrl", res.url);
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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()]);
    
    if (prodRes.success && prodRes.products) {
      setProducts(prodRes.products);
    } else {
      setError(prodRes.error || "Failed to load products.");
    }

    if (catRes.success && catRes.categories) {
      setCategories(catRes.categories);
    } else {
      setError(catRes.error || "Failed to load categories.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedProduct(null);
    reset({ name: "", description: "", price: 0, categoryId: "", imageUrl: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      categoryId: product.categoryId?._id || "",
      imageUrl: product.imageUrl,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    setError(null);

    const submitData = {
      name: values.name,
      description: values.description || "",
      price: values.price,
      categoryId: values.categoryId,
      imageUrl: values.imageUrl,
    };

    let res;
    if (modalMode === "add") {
      res = await createProduct(submitData);
    } else if (modalMode === "edit" && selectedProduct) {
      res = await updateProduct(selectedProduct._id, submitData);
    }

    if (res?.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      setError(res?.error || "Failed to save product.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete product "${product.name}"?`)) return;

    setLoading(true);
    setError(null);
    const res = await deleteProduct(product._id);

    if (res.success) {
      loadData();
    } else {
      setError(res.error || "Failed to delete product.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-white/[0.05] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
            <Package2 className="h-4.5 w-4.5 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Manage Products</h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">Create and manage direct storefront items</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          disabled={categories.length === 0}
          className="h-9 px-4 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-white/5 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400 flex items-start gap-2 max-w-2xl leading-normal">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Execution Error:</span> {error}
          </div>
        </div>
      )}

      {categories.length === 0 && !loading && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-400 flex items-start gap-2 max-w-2xl leading-normal">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Action Required:</span> You must create at least one category directory under "Manage Categories" before you can add products to the storefront.
          </div>
        </div>
      )}

      {/* Main product listing table */}
      <div className="border border-white/[0.05] bg-zinc-950/40 rounded-2xl overflow-hidden backdrop-blur-md">
        <table className="min-w-full divide-y divide-white/[0.05] text-left text-xs">
          <thead className="bg-white/[0.02] text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Product details</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 italic">
                  Loading product warehouse logs...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 italic">
                  No products defined. Click "Add Product" to get started.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-white/[0.03] flex items-center justify-center overflow-hidden shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xl">🎁</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white leading-none">{product.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 max-w-xs truncate">{product.description || "No description provided."}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {product.categoryId ? (
                      <span className="px-2 py-0.5 rounded-lg border border-white/[0.05] bg-white/[0.02] text-[10px] font-semibold uppercase tracking-wider">
                        {product.categoryId.name}
                      </span>
                    ) : (
                      <span className="text-zinc-600 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-white">${product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2 mt-0.5">
                    <button
                      onClick={() => openEditModal(product)}
                      className="h-8 w-8 rounded-lg border border-white/[0.08] hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Product"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="h-8 w-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 flex items-center justify-center cursor-pointer transition-colors"
                      title="Delete Product"
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

      {/* Add/Edit Product Glass Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#09090B] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <h3 className="font-extrabold text-sm text-white">
                {modalMode === "add" ? "Create Warehouse Product" : "Update Warehouse Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-7 w-7 rounded-lg border border-white/[0.08] hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g., Stardust Boost 1M, Rayquaza Catch"
                  {...register("name")}
                  className={cn(
                    "w-full h-9 px-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-colors",
                    errors.name && "border-red-500/50 focus:border-red-500"
                  )}
                />
                {errors.name && <p className="text-[10px] text-red-400 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Description</label>
                <textarea
                  placeholder="Details of the product or service..."
                  {...register("description")}
                  className="w-full min-h-[60px] p-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-colors leading-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Price ($)</label>
                  <input
                    type="number"
                    placeholder="999"
                    {...register("price", { valueAsNumber: true })}
                    className={cn(
                      "w-full h-9 px-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-colors",
                      errors.price && "border-red-500/50 focus:border-red-500"
                    )}
                  />
                  {errors.price && <p className="text-[10px] text-red-400 font-semibold">{errors.price.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Category Category</label>
                  <select
                    {...register("categoryId")}
                    className={cn(
                      "w-full h-9 px-2 bg-[#09090B] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-white transition-colors cursor-pointer",
                      errors.categoryId && "border-red-500/50 focus:border-red-500"
                    )}
                  >
                    <option value="" className="text-zinc-600">Select...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id} className="text-white bg-zinc-950">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-[10px] text-red-400 font-semibold">{errors.categoryId.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Product Image</label>
                
                <div className="flex gap-3">
                  <label className="flex-1 h-9 rounded-xl border border-dashed border-white/[0.1] hover:border-white/[0.2] bg-white/[0.01] hover:bg-white/[0.03] flex items-center justify-center cursor-pointer transition-colors">
                    <span className="text-[10px] font-bold text-zinc-400">
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
                </div>

                <div className="space-y-1">
                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Or enter direct URL</p>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or uploaded path"
                    {...register("imageUrl")}
                    className={cn(
                      "w-full h-9 px-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-colors",
                      errors.imageUrl && "border-red-500/50 focus:border-red-500"
                    )}
                  />
                  {errors.imageUrl && <p className="text-[10px] text-red-400 font-semibold">{errors.imageUrl.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-extrabold text-xs shadow-lg shadow-white/5 active:scale-95 transition-all mt-4"
              >
                {submitting ? "Saving changes..." : modalMode === "add" ? "Create Product" : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

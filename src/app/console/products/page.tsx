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
  mrpPrice: z.number({ message: "MRP must be a number" }),
  discountedPrice: z.number({ message: "Discounted price must be a number" }),
  isLimitedDeal: z.boolean(),
  dealExpiry: z.string().optional(),
  badge: z.enum(["MOST_PURCHASED", "POPULAR", ""]),
  categoryId: z.string().min(1, "Please select a category"),
  imageUrl: z.string().min(1, "Image URL is required"),
  imageUrls: z.array(z.string()),
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
  mrpPrice?: number;
  discountedPrice?: number;
  isLimitedDeal?: boolean;
  dealExpiry?: string | Date;
  badge?: "MOST_PURCHASED" | "POPULAR" | "";
  imageUrl: string;
  imageUrls?: string[];
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
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      mrpPrice: 0,
      discountedPrice: 0,
      isLimitedDeal: false,
      dealExpiry: "",
      badge: "",
      categoryId: "",
      imageUrl: "",
      imageUrls: [],
    }
  });

  const watchedImageUrls = watch("imageUrls") || [];
  const watchedImageUrl = watch("imageUrl") || "";
  const watchedIsLimitedDeal = watch("isLimitedDeal") || false;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError(null);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      const uploadPromise = new Promise<string>((resolve, reject) => {
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64 = reader.result as string;
          const res = await uploadProductImageAction(base64);
          if (res.success && res.url) {
            resolve(res.url);
          } else {
            reject(res.error || "Failed to upload image. Make sure Cloudinary keys are configured.");
          }
        };
        reader.onerror = () => {
          reject("Failed to read image file.");
        };
      });

      try {
        const url = await uploadPromise;
        uploadedUrls.push(url);
      } catch (err: any) {
        setError(err.message || String(err));
      }
    }

    if (uploadedUrls.length > 0) {
      const currentUrls = getValues("imageUrls") || [];
      const updatedUrls = [...currentUrls, ...uploadedUrls];
      setValue("imageUrls", updatedUrls);
      
      // Default primary image to first one if not set
      const currentPrimary = getValues("imageUrl");
      if (!currentPrimary || !updatedUrls.includes(currentPrimary)) {
        setValue("imageUrl", updatedUrls[0]);
      }
    }

    setUploadingImage(false);
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
    reset({
      name: "",
      description: "",
      mrpPrice: 0,
      discountedPrice: 0,
      isLimitedDeal: false,
      dealExpiry: "",
      badge: "",
      categoryId: "",
      imageUrl: "",
      imageUrls: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    
    let formattedExpiry = "";
    if (product.dealExpiry) {
      const d = new Date(product.dealExpiry);
      if (!isNaN(d.getTime())) {
        // Adjust to local datetime-local format: YYYY-MM-DDTHH:MM
        const tzoffset = d.getTimezoneOffset() * 60000; //offset in milliseconds
        const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
        formattedExpiry = localISOTime;
      }
    }

    reset({
      name: product.name,
      description: product.description || "",
      mrpPrice: product.mrpPrice || 0,
      discountedPrice: product.discountedPrice || 0,
      isLimitedDeal: product.isLimitedDeal || false,
      dealExpiry: formattedExpiry,
      badge: product.badge || "",
      categoryId: product.categoryId?._id || "",
      imageUrl: product.imageUrl,
      imageUrls: product.imageUrls || (product.imageUrl ? [product.imageUrl] : []),
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    setError(null);

    const submitData = {
      name: values.name,
      description: values.description || "",
      mrpPrice: values.mrpPrice,
      discountedPrice: values.discountedPrice,
      isLimitedDeal: values.isLimitedDeal,
      dealExpiry: values.isLimitedDeal && values.dealExpiry ? new Date(values.dealExpiry) : undefined,
      badge: values.badge || "",
      categoryId: values.categoryId,
      imageUrl: values.imageUrl,
      imageUrls: values.imageUrls || [],
    };

    let res;
    if (modalMode === "add") {
      res = await createProduct(submitData as any);
    } else if (modalMode === "edit" && selectedProduct) {
      res = await updateProduct(selectedProduct._id, submitData as any);
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
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Manage Products</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Create and manage direct storefront items.</p>
        </div>

        <button
          onClick={openAddModal}
          disabled={categories.length === 0}
          className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add Product
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

      {categories.length === 0 && !loading && (
        <div className="rounded-md border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-500 dark:text-yellow-400 flex items-start gap-2 max-w-2xl leading-normal">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Action Required:</span> You must create at least one category directory under "Manage Categories" before you can add products to the storefront.
          </div>
        </div>
      )}

      {/* Main product listing table */}
      <div className="border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] rounded-lg overflow-x-auto shadow-xs">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/[0.06] text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Product details</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.06] text-zinc-700 dark:text-zinc-300">
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
                <tr key={product._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.03] flex items-center justify-center overflow-hidden shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xl">🎁</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white leading-none">{product.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 max-w-xs truncate">{product.description || "No description provided."}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                    {product.categoryId ? (
                      <span className="px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/[0.05] bg-zinc-100 dark:bg-white/[0.02] text-[10px] font-semibold uppercase tracking-wider">
                        {product.categoryId.name}
                      </span>
                    ) : (
                      <span className="text-zinc-655 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">${product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2 mt-0.5">
                    <button
                      onClick={() => openEditModal(product)}
                      className="h-8 w-8 rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-white/[0.08] dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Product"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="h-8 w-8 rounded-lg text-zinc-550 hover:text-red-655 hover:bg-red-500/5 flex items-center justify-center cursor-pointer transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 dark:bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#09090B] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-3">
              <h3 className="font-semibold text-sm text-zinc-950 dark:text-white">
                {modalMode === "add" ? "Create Product" : "Update Product"}
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
                <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g., Stardust Boost 1M, Rayquaza Catch"
                  {...register("name")}
                  className={cn(
                    "w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors",
                    errors.name && "border-red-500/50 focus:border-red-500"
                  )}
                />
                {errors.name && <p className="text-[10px] text-red-400 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Description</label>
                <textarea
                  placeholder="Details of the product or service..."
                  {...register("description")}
                  className="w-full min-h-[60px] p-2.5 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors leading-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">MRP Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="1200"
                    {...register("mrpPrice", { valueAsNumber: true })}
                    className={cn(
                      "w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors",
                      errors.mrpPrice && "border-red-500/50 focus:border-red-500"
                    )}
                  />
                  {errors.mrpPrice && <p className="text-[10px] text-red-400 font-semibold">{errors.mrpPrice.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Discounted Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="999"
                    {...register("discountedPrice", { valueAsNumber: true })}
                    className={cn(
                      "w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors",
                      errors.discountedPrice && "border-red-500/50 focus:border-red-500"
                    )}
                  />
                  {errors.discountedPrice && <p className="text-[10px] text-red-400 font-semibold">{errors.discountedPrice.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Category</label>
                  <select
                    {...register("categoryId")}
                    className={cn(
                      "w-full h-8 px-2 bg-zinc-100 dark:bg-[#09090B] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors cursor-pointer",
                      errors.categoryId && "border-red-500/50 focus:border-red-500"
                    )}
                  >
                    <option value="" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Select...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id} className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-[10px] text-red-400 font-semibold">{errors.categoryId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Badge</label>
                  <select
                    {...register("badge")}
                    className={cn(
                      "w-full h-8 px-2 bg-zinc-100 dark:bg-[#09090B] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors cursor-pointer",
                      errors.badge && "border-red-500/50 focus:border-red-500"
                    )}
                  >
                    <option value="" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">No Badge</option>
                    <option value="MOST_PURCHASED" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Most Purchased</option>
                    <option value="POPULAR" className="text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#09090B]">Popular</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 p-3 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px] cursor-pointer" htmlFor="isLimitedDeal">
                    Limited Time Deal
                  </label>
                  <input
                    id="isLimitedDeal"
                    type="checkbox"
                    {...register("isLimitedDeal")}
                    className="h-4 w-4 rounded border-zinc-200 dark:border-white/[0.08] text-zinc-900 focus:ring-zinc-900/10 cursor-pointer"
                  />
                </div>
                {watchedIsLimitedDeal && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Deal Expiry Date</label>
                    <input
                      type="datetime-local"
                      {...register("dealExpiry")}
                      className="w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Product Images</label>
                
                <div className="flex gap-3">
                  <label className="flex-1 h-8 rounded-md border border-dashed border-zinc-200 dark:border-white/[0.1] hover:border-zinc-400 dark:hover:border-white/[0.2] bg-zinc-50 hover:bg-zinc-100 dark:bg-white/[0.01] dark:hover:bg-white/[0.03] flex items-center justify-center cursor-pointer transition-colors">
                    <span className="text-[10px] font-semibold text-zinc-500">
                      {uploadingImage ? "Uploading to Cloudinary..." : "Choose Image Files"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {watchedImageUrls.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold">Uploaded Images (click overlay to set primary)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {watchedImageUrls.map((url, idx) => {
                        const isPrimary = watchedImageUrl === url;
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "relative aspect-square rounded-md border overflow-hidden bg-zinc-50 dark:bg-black/20 flex items-center justify-center group/img",
                              isPrimary ? "border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white" : "border-zinc-200 dark:border-white/[0.08]"
                            )}
                          >
                            <img src={url} alt="product" className="max-h-full max-w-full object-contain" />
                            <button
                              type="button"
                              onClick={() => setValue("imageUrl", url)}
                              className="absolute inset-0 bg-black/45 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-bold text-white uppercase text-center cursor-pointer"
                            >
                              {isPrimary ? "★ Primary" : "Set Primary"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newUrls = watchedImageUrls.filter((u) => u !== url);
                                setValue("imageUrls", newUrls);
                                if (isPrimary) {
                                  setValue("imageUrl", newUrls.length > 0 ? newUrls[0] : "");
                                }
                              }}
                              className="absolute top-0.5 right-0.5 h-4.5 w-4.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer shadow-xs text-[10px]"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold">Primary Image URL</p>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or select above"
                    {...register("imageUrl")}
                    className={cn(
                      "w-full h-8 px-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-655 focus:outline-none focus:border-zinc-400 dark:focus:border-white transition-colors",
                      errors.imageUrl && "border-red-500/50 focus:border-red-500"
                    )}
                  />
                  {errors.imageUrl && <p className="text-[10px] text-red-400 font-semibold">{errors.imageUrl.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-8 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition-colors mt-4 cursor-pointer"
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

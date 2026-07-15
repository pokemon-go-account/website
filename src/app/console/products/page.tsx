"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, uploadProductImageAction, saveProductOrder } from "@/features/admin/actions";
import { Package2, Plus, Pencil, Trash2, X, AlertTriangle, Loader2, ArrowUp, ArrowDown } from "lucide-react";
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
  isFeatured: z.boolean().optional(),
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
  isFeatured?: boolean;
  imageUrl: string;
  imageUrls?: string[];
  categoryId?: Category;
}

export default function ManageProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category Filter Tab
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("ALL");

  const getProductCountForCategory = (catId: string) => {
    if (catId === "ALL") return products.length;
    return products.filter((p) => p.categoryId?._id === catId).length;
  };

  const filteredProducts = activeCategoryTab === "ALL" 
    ? products 
    : products.filter((p) => p.categoryId?._id === activeCategoryTab);

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
      isFeatured: false,
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
      imageUrls: [],
      isFeatured: false,
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
      isFeatured: product.isFeatured || false,
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
      isFeatured: values.isFeatured || false,
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

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newProducts = [...filteredProducts];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newProducts.length) return;

    // Swap elements in place
    const temp = newProducts[index];
    newProducts[index] = newProducts[targetIndex];
    newProducts[targetIndex] = temp;

    // Instantly update products local state for zero-latency UI update
    const updatedFullProducts = [...products];
    const itemA = filteredProducts[index];
    const itemB = filteredProducts[targetIndex];
    const idxA = products.findIndex(p => p._id === itemA._id);
    const idxB = products.findIndex(p => p._id === itemB._id);
    if (idxA !== -1 && idxB !== -1) {
      const tempItem = updatedFullProducts[idxA];
      updatedFullProducts[idxA] = updatedFullProducts[idxB];
      updatedFullProducts[idxB] = tempItem;
      setProducts(updatedFullProducts);
    }

    const orderedIds = newProducts.map((p) => p._id);
    const res = await saveProductOrder(orderedIds);
    if (!res.success) {
      setError(res.error || "Failed to save product order.");
      loadData();
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Products</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{products.length}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center text-zinc-500">
            <Package2 className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Categories</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{categories.length}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center text-zinc-500">
            <Plus className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Filtered View</p>
            <p className="text-xl font-bold text-[#6133e1] dark:text-purple-400 mt-1">{filteredProducts.length} Items</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center text-[#6133e1] dark:text-purple-400">
            <Package2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 border-b border-zinc-200 dark:border-white/[0.06] pb-px overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveCategoryTab("ALL")}
          className={cn(
            "px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5",
            activeCategoryTab === "ALL"
              ? "border-[#6133e1] text-[#6133e1] dark:border-purple-400 dark:text-purple-400 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/10"
          )}
        >
          All Products
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
            activeCategoryTab === "ALL" ? "bg-[#6133e1]/10" : "bg-zinc-100 dark:bg-white/5"
          )}>
            {products.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = getProductCountForCategory(cat._id);
          return (
            <button
              key={cat._id}
              onClick={() => setActiveCategoryTab(cat._id)}
              className={cn(
                "px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5",
                activeCategoryTab === cat._id
                  ? "border-[#6133e1] text-[#6133e1] dark:border-purple-400 dark:text-purple-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/10"
              )}
            >
              {cat.name}
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                activeCategoryTab === cat._id ? "bg-[#6133e1]/10" : "bg-zinc-100 dark:bg-white/5"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Redesigned grid list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#6133e1]" />
          <p className="text-xs text-zinc-500">Loading storefront catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.06] bg-zinc-50/20 dark:bg-white/[0.01] p-16 text-center">
          <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center text-zinc-400 mx-auto">
            <Package2 className="h-5 w-5" />
          </div>
          <h3 className="text-zinc-800 dark:text-zinc-200 text-xs font-bold uppercase tracking-wider mt-3">No Products Found</h3>
          <p className="text-zinc-450 dark:text-zinc-500 text-[10px] mt-1 max-w-xs mx-auto">
            There are no products in this category. Click "Add Product" to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredProducts.map((product, idx) => (
            <div
              key={product._id}
              className="group rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-4 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-white/[0.1] hover:shadow-xs transition-all duration-200"
            >
              <div className="space-y-3 relative">
                {/* Image View */}
                <div className="relative aspect-square w-full rounded-lg bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-3xl select-none">🎁</span>
                  )}

                  {/* Badge Overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    {product.badge && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider text-white shadow-xs",
                        product.badge === "MOST_PURCHASED" ? "bg-amber-500" : "bg-purple-600"
                      )}>
                        {product.badge === "MOST_PURCHASED" ? "Most Purchased" : "Popular"}
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider text-white bg-emerald-500 shadow-xs">
                        ★ Featured
                      </span>
                    )}
                  </div>
                  
                  {/* Category Tag Overlay */}
                  {product.categoryId && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-zinc-900/75 dark:bg-black/75 backdrop-blur-xs text-[7px] font-bold uppercase tracking-wider text-white border border-white/10">
                      {product.categoryId.name}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-xs text-zinc-950 dark:text-white leading-snug truncate">
                    {product.name}
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 h-7 leading-relaxed">
                    {product.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-150 dark:border-white/[0.04] flex items-center justify-between">
                <div>
                  {product.mrpPrice && product.discountedPrice && product.mrpPrice > product.discountedPrice ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-zinc-450 line-through">${product.mrpPrice}</span>
                        <span className="text-[8px] font-bold text-red-500 dark:text-red-400 bg-red-500/10 px-1 rounded">
                          {Math.round(((product.mrpPrice - product.discountedPrice) / product.mrpPrice) * 100)}% OFF
                        </span>
                      </div>
                      <p className="text-zinc-900 dark:text-white font-bold text-xs">
                        ${product.discountedPrice}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-[8px] text-zinc-455 uppercase tracking-wider leading-none">Price</p>
                      <p className="text-zinc-900 dark:text-white font-bold text-xs mt-0.5">
                        ${product.price}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-1.5">
                  {activeCategoryTab !== "ALL" && (
                    <>
                      <button
                        onClick={() => handleMove(idx, "up")}
                        disabled={idx === 0}
                        className="h-7 w-7 rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-white/[0.08] dark:hover:bg-white/5 text-zinc-550 hover:text-zinc-950 dark:text-zinc-450 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, "down")}
                        disabled={idx === filteredProducts.length - 1}
                        className="h-7 w-7 rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-white/[0.08] dark:hover:bg-white/5 text-zinc-550 hover:text-zinc-950 dark:text-zinc-450 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openEditModal(product)}
                    className="h-7 w-7 rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-white/[0.08] dark:hover:bg-white/5 text-zinc-550 hover:text-zinc-950 dark:text-zinc-450 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                    title="Edit Product"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="h-7 w-7 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center justify-center cursor-pointer transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add/Edit Product Glass Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#09090B] p-6 shadow-2xl space-y-4">
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
                <label className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g., Stardust Boost 1M, Rayquaza Catch"
                  {...register("name")}
                  className={cn(
                    "w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white focus:border-zinc-950 dark:focus:border-white transition-all text-xs",
                    errors.name && "border-red-500 focus:ring-red-500 focus:border-red-500"
                  )}
                />
                {errors.name && <p className="text-[10px] text-red-400 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Description</label>
                <textarea
                  placeholder="Details of the product or service..."
                  {...register("description")}
                  className="w-full min-h-[60px] p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white focus:border-zinc-950 dark:focus:border-white transition-all leading-normal text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">MRP Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="1200"
                    {...register("mrpPrice", { valueAsNumber: true })}
                    className={cn(
                      "w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white focus:border-zinc-950 dark:focus:border-white transition-all text-xs",
                      errors.mrpPrice && "border-red-500 focus:ring-red-500 focus:border-red-500"
                    )}
                  />
                  {errors.mrpPrice && <p className="text-[10px] text-red-400 font-semibold">{errors.mrpPrice.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Discounted Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="999"
                    {...register("discountedPrice", { valueAsNumber: true })}
                    className={cn(
                      "w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white focus:border-zinc-950 dark:focus:border-white transition-all text-xs",
                      errors.discountedPrice && "border-red-500 focus:ring-red-500 focus:border-red-500"
                    )}
                  />
                  {errors.discountedPrice && <p className="text-[10px] text-red-400 font-semibold">{errors.discountedPrice.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Category</label>
                  <select
                    {...register("categoryId")}
                    className={cn(
                      "w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white focus:border-zinc-950 dark:focus:border-white transition-all cursor-pointer text-xs",
                      errors.categoryId && "border-red-500 focus:ring-red-500 focus:border-red-500"
                    )}
                  >
                    <option value="" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900">Select...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-[10px] text-red-400 font-semibold">{errors.categoryId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Badge</label>
                  <select
                    {...register("badge")}
                    className={cn(
                      "w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white focus:border-zinc-950 dark:focus:border-white transition-all cursor-pointer text-xs",
                      errors.badge && "border-red-500 focus:ring-red-500 focus:border-red-500"
                    )}
                  >
                    <option value="" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900">No Badge</option>
                    <option value="MOST_PURCHASED" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900">Most Purchased</option>
                    <option value="POPULAR" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900">Popular</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px] cursor-pointer" htmlFor="isLimitedDeal">
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
                    <label className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Deal Expiry Date</label>
                    <input
                      type="datetime-local"
                      {...register("dealExpiry")}
                      className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white focus:border-zinc-950 dark:focus:border-white transition-all text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-3.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px] cursor-pointer" htmlFor="isFeatured">
                    Show in Landing Page (Featured Store Services)
                  </label>
                  <input
                    id="isFeatured"
                    type="checkbox"
                    {...register("isFeatured")}
                    className="h-4 w-4 rounded border-zinc-200 dark:border-white/[0.08] text-zinc-900 focus:ring-zinc-900/10 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Product Images</label>
                
                <div className="flex gap-3">
                  <label className="flex-1 h-9 rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.1] hover:border-zinc-450 dark:hover:border-white/[0.2] bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/40 dark:hover:bg-zinc-900 flex items-center justify-center cursor-pointer transition-all">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                      {uploadingImage ? "Uploading to Cloudinary..." : "Upload Image Files"}
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
                              className="absolute top-0.5 right-0.5 h-4.5 w-4.5 rounded-full bg-red-650/90 hover:bg-red-650 text-white flex items-center justify-center cursor-pointer shadow-xs text-[10px]"
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
                  <p className="text-[8px] text-zinc-550 uppercase tracking-wider font-semibold">Primary Image URL</p>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or select above"
                    {...register("imageUrl")}
                    className={cn(
                      "w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white focus:border-zinc-950 dark:focus:border-white transition-all text-xs",
                      errors.imageUrl && "border-red-500 focus:ring-red-500 focus:border-red-500"
                    )}
                  />
                  {errors.imageUrl && <p className="text-[10px] text-red-400 font-semibold">{errors.imageUrl.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold text-xs transition-all active:scale-[0.98] mt-4 cursor-pointer shadow-sm disabled:opacity-50"
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

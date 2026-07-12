import { getStoreCategories, getStoreProducts } from "@/features/store/actions";
import { StorefrontClient } from "@/features/store/components/storefront-client";

export const revalidate = 0; // Dynamic route

export default async function StorefrontPage() {
  const [categoriesRes, productsRes] = await Promise.all([
    getStoreCategories(),
    getStoreProducts(),
  ]);

  if (!categoriesRes.success || !productsRes.success) {
    return (
      <div className="flex h-screen items-center justify-center bg-black dark:bg-[#09090B] text-zinc-500 text-xs">
        Failed to load direct storefront services.
      </div>
    );
  }

  return (
    <StorefrontClient
      categories={categoriesRes.categories || []}
      products={productsRes.products || []}
    />
  );
}

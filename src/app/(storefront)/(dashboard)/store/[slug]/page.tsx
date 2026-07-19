import { Metadata } from "next";
import { getStoreCategories, getStoreProducts } from "@/features/store/actions";
import { StorefrontClient } from "@/features/store/components/storefront-client";
import { Suspense } from "react";
import { notFound } from "next/navigation";

export const revalidate = 0; // Dynamic route

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoriesRes = await getStoreCategories();
  
  if (categoriesRes.success && categoriesRes.categories) {
    const category = categoriesRes.categories.find(
      (c: any) => c.slug.toLowerCase() === slug.toLowerCase()
    );

    if (category) {
      const catName = category.name;
      return {
        title: `Buy ${catName} | Pokémon GO Store & Marketplace`,
        description: `Buy verified ${catName} in Pokémon GO. Instant escrow delivery, 24/7 customer support, and cheap rates on Pokémon GO accounts, coins, stardust & services.`,
        keywords: [
          `buy ${catName.toLowerCase()}`,
          `pokemon go ${catName.toLowerCase()}`,
          `pokemon go ${slug.toLowerCase()}`,
          "pokemon go store",
          "buy pokemon go accounts",
          "buy stardust pokemon go",
          "cheap pokemon go store",
        ],
      };
    }
  }

  const formattedName = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `Buy ${formattedName} | Pokémon GO Store`,
    description: `Browse and buy ${formattedName} services in our official Pokémon GO storefront catalog.`,
  };
}

export default async function CategoryStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  const categoryExists = (categoriesRes.categories || []).some(
    (c: any) => c.slug.toLowerCase() === slug.toLowerCase()
  );

  if (!categoryExists) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black dark:bg-[#09090B] text-zinc-500 text-xs">Loading {slug} services...</div>}>
      <StorefrontClient
        categories={categoriesRes.categories || []}
        products={productsRes.products || []}
        initialCategorySlug={slug}
      />
    </Suspense>
  );
}

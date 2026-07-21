import { Metadata } from "next";
import { getStoreCategories, getStoreProducts } from "@/features/store/actions";
import { StorefrontClient } from "@/features/store/components/storefront-client";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Pokémon GO Store | Buy Stardust, Coins, Rare Pokémon & Services",
  description: "Official Pokémon GO store. Buy Pokémon GO coins, stardust top-ups, shiny Pokémon for sale, raids assistance, Pokéballs, and rare Pokémon accounts.",
  keywords: [
    "pokemon go store",
    "buy pokemon go pokemon",
    "buy pokemon go pokemons",
    "buy stardust pokemon go",
    "pokemon go coins",
    "pokemon go balls",
    "pokemon go services",
    "pokemon go merch",
    "shiny pokemon for sale pokemon go",
    "pokemon go shiny",
    "rare pokemon",
    "rare pokémon",
    "best pokemon in pokemon go",
    "mewtwo pokemon go",
    "charizard pokemon go",
    "snorlax pokemon go",
    "pokemon go dragonite"
  ],
};

export const revalidate = 30; // ISR cache on Vercel CDN for 30s

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
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black dark:bg-[#09090B] text-zinc-500 text-xs">Loading storefront catalog...</div>}>
      <StorefrontClient
        categories={categoriesRes.categories || []}
        products={productsRes.products || []}
      />
    </Suspense>
  );
}

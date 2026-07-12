import { Hero } from "@/features/landing/components/hero";
import { Features } from "@/features/landing/components/features";
import { FeaturedAuctions } from "@/features/landing/components/featured-auctions";
import { FeaturedStoreItems } from "@/features/landing/components/featured-store-items";
import { FAQ } from "@/features/landing/components/faq";

export const revalidate = 0; // Dynamic rendering

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#0d0d0f]">
      <Hero />
      <Features />
      <FeaturedAuctions />
      <FeaturedStoreItems />
      <FAQ />
    </div>
  );
}
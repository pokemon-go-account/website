import { Hero } from "@/features/landing/components/hero";
import { Features } from "@/features/landing/components/features";
import { FeaturedAuctions } from "@/features/landing/components/featured-auctions";
import { FeaturedStoreItems } from "@/features/landing/components/featured-store-items";
import { FAQ } from "@/features/landing/components/faq";
import { FeedbackShowcase } from "@/features/landing/components/feedback-showcase";
import { Suspense } from "react";

export const revalidate = 60; // Cache page for 60 seconds (ISR)

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Hero />
      <Features />
      
      {/* Dynamic live auctions wrapper */}
      <Suspense fallback={
        <section className="relative w-full overflow-hidden py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800/80 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-lg bg-zinc-100/50 dark:bg-[#111111]/50 border border-zinc-200 dark:border-white/[0.06] animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      }>
        <FeaturedAuctions />
      </Suspense>

      {/* Dynamic featured storefront products wrapper */}
      <Suspense fallback={
        <section className="relative w-full overflow-hidden border-t border-zinc-200 dark:border-white/[0.06] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800/80 rounded animate-pulse mx-auto" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 rounded-lg bg-zinc-100/50 dark:bg-[#111111]/50 border border-zinc-200 dark:border-white/[0.06] animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      }>
        <FeaturedStoreItems />
      </Suspense>

      <FAQ />

      {/* Dynamic feedbacks marquee wrapper */}
      <Suspense fallback={
        <section className="relative w-full overflow-hidden border-t border-zinc-200 dark:border-white/[0.06] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-20 w-full bg-zinc-100/50 dark:bg-[#111111]/50 rounded-lg border border-zinc-200 dark:border-white/[0.06] animate-pulse" />
          </div>
        </section>
      }>
        <FeedbackShowcase />
      </Suspense>
    </div>
  );
}
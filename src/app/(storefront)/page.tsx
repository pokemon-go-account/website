import { Hero } from "@/features/landing/components/hero";
import { Features } from "@/features/landing/components/features";
import { FeaturedAuctions } from "@/features/landing/components/featured-auctions";
import { FeaturedStoreItems } from "@/features/landing/components/featured-store-items";
import { FAQ } from "@/features/landing/components/faq";
import { FeedbackShowcase } from "@/features/landing/components/feedback-showcase";
export const revalidate = 60; // Cache page for 60 seconds (ISR)

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Hero />
      <Features />
      
      <FeaturedAuctions />

      <FeaturedStoreItems />

      <FAQ />

      <FeedbackShowcase />
    </div>
  );
}
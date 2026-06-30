import { Hero } from "@/features/landing/components/hero";
import { Features } from "@/features/landing/components/features";
import { FAQ } from "@/features/landing/components/faq";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Structural layout grid composition slots */}
      <Hero />
      <Features />
      <FAQ />
      
      {/* Minimalistic SaaS Footer */}
      <footer className="mt-auto border-t border-border bg-muted/30 dark:bg-neutral-950/60 py-8 px-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 Premium Auction Engine. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
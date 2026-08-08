import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, HelpCircle, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Return & Refund Policy — Pokémon GO Services",
  description: "Learn about our Return & Refund Policy for digital accounts, auctions, and boosting services on Pokémon GO Services.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#070709] text-zinc-900 dark:text-zinc-100 py-12 md:py-20 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Hero */}
        <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 dark:from-[#12111a] dark:via-[#090810] dark:to-[#12111a] p-8 md:p-12 text-white overflow-hidden shadow-2xl border border-zinc-800 dark:border-white/10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#6133e1]/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6133e1]/20 border border-[#6133e1]/40 text-[#a78bfa] text-xs font-bold uppercase tracking-wider">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Customer Care & Transparency</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Return & Refund Policy
            </h1>
            
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-light">
              We strive for complete transparency regarding digital account transactions, live auction bids, and boosting services delivered across our platform.
            </p>
            
            <div className="pt-2 text-xs text-zinc-500">
              <span>Last Updated: August 2026</span>
            </div>
          </div>
        </div>

        {/* Diplomatic Summary Banner */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs leading-relaxed text-purple-900 dark:text-purple-200">
          <ShieldCheck className="h-8 w-8 text-[#6133e1] dark:text-[#a78bfa] shrink-0" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[#6133e1] dark:text-[#a78bfa]">
              Digital Goods & Final Sale Assurance
            </h3>
            <p>
              Due to the immediate, irrevocable nature of digital game account transfers and virtual in-game services, <strong>all completed purchases and winning auction bids are final and non-refundable</strong> once account credentials or service execution has commenced.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white dark:bg-[#111116] rounded-2xl p-6 sm:p-10 border border-zinc-200 dark:border-white/10 shadow-sm space-y-10 text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-[#6133e1]/10 text-[#6133e1] dark:text-[#a78bfa] flex items-center justify-center text-xs font-black">1</span>
              Immediate Digital Delivery & Non-Returnable Items
            </h2>
            <p>
              Pokémon GO accounts, stardust packages, shiny Pokémon transfers, and auction lots consist of intangible digital assets. Unlike physical goods, digital assets cannot be physically returned or restored to their original pre-transfer state once account access details or login credentials have been transmitted to the buyer.
            </p>
            <p>
              Consequently, once a buyer receives access to a purchased account or a service is fulfilled, <strong>returns, exchanges, or voluntary refunds cannot be processed</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-[#6133e1]/10 text-[#6133e1] dark:text-[#a78bfa] flex items-center justify-center text-xs font-black">2</span>
              48-Hour Escrow Protection & Verification Window
            </h2>
            <p>
              To ensure buyers receive exactly what was advertised, our platform enforces a <strong>48-hour Escrow Protection Window</strong> for all orders and auction wins:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Funds remain securely held by the platform escrow system upon payment.</li>
              <li>Buyers are granted 48 hours from delivery to inspect the account and verify that all Level, Stardust, Shiny Pokémon, and IV stats match the listing description.</li>
              <li>If an account fails to match the listing specifications or credentials do not work upon initial delivery, our support team will intervene to rectify the issue or issue a full refund prior to releasing funds to the seller.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-[#6133e1]/10 text-[#6133e1] dark:text-[#a78bfa] flex items-center justify-center text-xs font-black">3</span>
              Live Auction Binding Bids & Registration Fees
            </h2>
            <p>
              Bids placed on live auctions represent a binding commitment to purchase. Auction registration fees and winning bids cannot be refunded or cancelled once an auction concludes. Bidders are encouraged to review listing details, screenshots, and seller feedback carefully prior to placing bids.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-[#6133e1]/10 text-[#6133e1] dark:text-[#a78bfa] flex items-center justify-center text-xs font-black">4</span>
              Customer Support & Issue Resolution
            </h2>
            <p>
              While returns are not supported post-fulfillment, customer satisfaction is our top priority. If you encounter any technical difficulty, login assistance request, or order issue, please reach out directly to our 24/7 support team. We will work diligently with you to resolve any operational concerns.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-[#6133e1]/10 text-[#6133e1] dark:text-[#a78bfa] flex items-center justify-center text-xs font-black">5</span>
              Unauthorized Chargebacks
            </h2>
            <p>
              Initiating unauthorized payment chargebacks or false dispute claims after receiving digital credentials violates our platform Terms of Service. Accounts associated with fraudulent chargebacks will face immediate permanent suspension and asset recovery action.
            </p>
          </section>
        </div>

        {/* Contact Support Footer CTA */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-900/30 via-[#6133e1]/20 to-purple-900/30 border border-[#6133e1]/30 p-8 text-center space-y-4">
          <HelpCircle className="h-8 w-8 text-[#a78bfa] mx-auto" />
          <h3 className="text-xl font-bold">Have questions before placing an order?</h3>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Our support team is available 24/7 to answer questions about account specifications, auction verification, and platform safety before you complete your purchase.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6133e1] hover:bg-[#5229c7] text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Contact 24/7 Support
            </Link>
          </div>
        </div>

        {/* Policy Footer Links */}
        <div className="border-t border-zinc-200 dark:border-white/10 pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">← Back to Storefront</Link>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">Privacy Policy</Link>
            <span>•</span>
            <Link href="/why-trust-us" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">Why Trust Us</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Pokémon GO Services",
  description: "Read the Terms of Service for using our Pokémon GO auction and direct storefront platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-zinc-900 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-zinc-200 dark:border-white/[0.06] pb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Legal Document</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Last updated: <strong className="text-zinc-700 dark:text-zinc-300">July 2025</strong>
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-loose">
            By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully before participating in any auction or purchasing from our direct storefront.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10 text-sm leading-loose text-zinc-600 dark:text-zinc-400">

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">1. Acceptance of Terms</h2>
            <p>
              By registering an account or using any feature of our platform (&quot;Service&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please discontinue use of the Service immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">2. Eligibility</h2>
            <p>
              You must be at least 18 years old or the age of majority in your jurisdiction to use this platform. By creating an account, you represent and warrant that you meet this requirement. We reserve the right to terminate accounts found to be in violation of this provision.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">3. Account Registration</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use. We are not liable for any loss or damage arising from your failure to keep your credentials secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">4. Auction Rules</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All bids placed are binding. You are legally obligated to complete the purchase if you win an auction.</li>
              <li>Registration fees for auctions are non-refundable once processed.</li>
              <li>Shill bidding, bid manipulation, or any form of auction fraud will result in immediate account termination and may be reported to relevant authorities.</li>
              <li>Auction end times are final. No extensions will be granted except in cases of documented platform outages.</li>
              <li>The platform reserves the right to cancel any auction at its sole discretion.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">5. Direct Storefront Purchases</h2>
            <p>
              All sales from the direct storefront are final. Products listed represent Pokémon GO game assets and services. We do not guarantee any particular outcome from purchased services. Chargebacks will result in permanent account suspension.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">6. Escrow & Payment</h2>
            <p>
              Winning bidders are required to complete payment within 24 hours of auction conclusion. All funds are held in escrow until successful delivery verification. Disputes must be raised within 48 hours of delivery. After this period, funds are released to the seller.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">7. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the platform for any unlawful purpose or in violation of any regulations.</li>
              <li>Attempt to gain unauthorized access to any part of the platform.</li>
              <li>Misrepresent your identity or provide false information.</li>
              <li>Engage in any conduct that disrupts or interferes with the platform&apos;s operation.</li>
              <li>Reverse-engineer, scrape, or copy any part of the platform.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, the platform and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the Service or any transactions conducted through it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">9. Modifications</h2>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the platform after any modification constitutes your acceptance of the new terms. We will make reasonable efforts to notify users of significant changes via email or on-platform notification.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">10. Contact</h2>
            <p>
              For questions about these Terms, please contact us through the{" "}
              <Link href="/contact" className="text-zinc-900 dark:text-white font-bold underline underline-offset-2 hover:opacity-70 transition-opacity">
                Contact page
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="border-t border-zinc-200 dark:border-white/[0.06] pt-8 flex flex-wrap gap-4 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">← Back to Home</Link>
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">Contact</Link>
        </div>
      </div>
    </div>
  );
}

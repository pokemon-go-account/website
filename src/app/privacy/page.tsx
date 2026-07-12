import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Pokémon GO Services",
  description: "Learn how we collect, use, and protect your personal data on our Pokémon GO services platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-zinc-200 dark:border-white/[0.06] pb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Legal Document</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Last updated: <strong className="text-zinc-700 dark:text-zinc-300">July 2025</strong>
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-loose">
            We are committed to protecting your personal information and your right to privacy. This policy explains what information we collect, how we use it, and your rights regarding your data.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10 text-sm leading-loose text-zinc-600 dark:text-zinc-400">

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">1. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-zinc-700 dark:text-zinc-300">Account Information:</strong> Name, email address, and profile details you provide during registration or via OAuth (Google sign-in).</li>
              <li><strong className="text-zinc-700 dark:text-zinc-300">Transaction Data:</strong> Bid history, auction participation records, purchase history, and payment references.</li>
              <li><strong className="text-zinc-700 dark:text-zinc-300">Usage Data:</strong> Pages visited, features used, timestamps, and general interaction patterns.</li>
              <li><strong className="text-zinc-700 dark:text-zinc-300">Device Information:</strong> Browser type, operating system, and IP address for security and analytics purposes.</li>
              <li><strong className="text-zinc-700 dark:text-zinc-300">Communications:</strong> Messages sent through our contact form or support channels.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Operate, maintain, and improve the platform.</li>
              <li>Process payments, manage auctions, and fulfil orders.</li>
              <li>Communicate auction updates, bid notifications, and transaction confirmations.</li>
              <li>Prevent fraud, enforce our Terms of Service, and protect platform integrity.</li>
              <li>Analyze usage trends to improve user experience.</li>
              <li>Comply with applicable legal obligations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">3. Sharing of Information</h2>
            <p>
              We do <strong className="text-zinc-700 dark:text-zinc-300">not</strong> sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-zinc-700 dark:text-zinc-300">Service Providers:</strong> Trusted third-party services (e.g., Cloudinary for image hosting, Razorpay for payment processing) that assist in operating our platform. These parties are bound by confidentiality agreements.</li>
              <li><strong className="text-zinc-700 dark:text-zinc-300">Legal Requirements:</strong> When required by law, court order, or governmental authority.</li>
              <li><strong className="text-zinc-700 dark:text-zinc-300">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, where user data may be transferred as a business asset.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">4. Cookies & Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to maintain your session, remember your preferences (such as dark/light theme), and analyze platform usage. You can control cookie settings through your browser, though disabling certain cookies may affect platform functionality.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide services. Transaction records may be retained for up to 7 years for legal and financial compliance. You may request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including encrypted connections (HTTPS), hashed credentials, and access controls to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete information.</li>
              <li>Request deletion of your personal data (&quot;right to be forgotten&quot;).</li>
              <li>Object to or restrict certain processing of your data.</li>
              <li>Data portability — receive your data in a structured, machine-readable format.</li>
            </ul>
            <p>To exercise any of these rights, please contact us through our Contact page.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">8. Third-Party Links</h2>
            <p>
              Our platform may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies independently.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">9. Children&apos;s Privacy</h2>
            <p>
              Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If you become aware that a child has provided us with personal data, please contact us immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">10. Changes to this Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on our platform. Continued use of the Service after such changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-zinc-900 dark:text-white">11. Contact Us</h2>
            <p>
              For privacy-related inquiries or to exercise your rights, please reach out via our{" "}
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
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">Terms of Service</Link>
          <Link href="/contact" className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">Contact</Link>
        </div>
      </div>
    </div>
  );
}

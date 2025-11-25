import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Use - 3pt.bot",
  description: "3pt.bot Terms of Use",
  openGraph: {
    title: "Terms of Use - 3pt.bot",
    description: "Terms of Use for 3pt.bot",
    url: "https://www.3pt.bot/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 w-full pt-6">
        <Header />
      </div>

      <main className="flex-grow max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Terms of Use
          </h1>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 md:p-10 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              By using <span className="font-orbitron">3pt<span className="text-3pt-orange">.bot</span></span>, you agree to these terms. If you do not agree, please do not use this website.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="bg-gray-100 border-2 border-gray-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Disclaimer
            </h2>
            <div className="space-y-3 text-sm">
              <p className="text-gray-700 leading-relaxed">
                THIS WEBSITE AND ALL CONTENT ARE PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
              </p>
              <p className="text-gray-700 leading-relaxed">
                All information on this website, including card data, pricing, and AI-generated content, is for informational purposes only. We make no guarantees about accuracy or completeness. Verify all information independently before making decisions.
              </p>
            </div>
          </section>

          {/* Affiliate Disclosure */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Affiliate Disclosure
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We participate in affiliate programs including the eBay Partner Network. We earn commissions from qualifying purchases made through links on this site. Affiliate links do not constitute endorsements of any products or sellers.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-gray-100 border-2 border-gray-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, <span className="font-orbitron text-xs">3pt<span className="text-3pt-orange">.bot</span></span> SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED $10 USD.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Intellectual Property
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Website content is protected by copyright and other intellectual property laws. You may use the website for personal, non-commercial purposes only. All trademarks are property of their respective owners.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Third-Party Links
            </h2>
            <p className="text-gray-700 leading-relaxed">
              This website contains links to third-party sites. We are not responsible for their content, policies, or practices. Use third-party sites at your own risk.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These terms are governed by Delaware law. Any disputes shall be resolved in courts located in Wilmington, Delaware.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Changes
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these terms at any time. Continued use of the website constitutes acceptance of any changes.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Contact
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Questions about these terms? Contact us through our social media channels listed in the footer.
            </p>
          </section>
        </div>
      </main>

      <div className="max-w-6xl mx-auto px-6 w-full">
        <Footer />
      </div>
    </div>
  );
}

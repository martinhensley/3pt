import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLibraryStats } from "@/lib/database";

export const metadata: Metadata = {
  title: "About Us - 3pt.bot",
  description: "Learn about 3pt.bot, your ultimate resource for basketball card information, collection management, and market insights.",
  openGraph: {
    title: "About Us - 3pt.bot",
    description: "Learn about 3pt.bot, your ultimate resource for basketball card information.",
    url: "https://www.3pt.bot/about",
  },
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M+`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K+`;
  }
  return `${num.toLocaleString()}`;
}

export default async function AboutPage() {
  const stats = await getLibraryStats();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 w-full pt-6">
        <Header />
      </div>

      <main className="flex-grow max-w-4xl mx-auto px-6 py-12">
        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 space-y-8">
          {/* Mission Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-3pt-green mr-2">🏀</span>
              Our Mission
            </h2>
            <p className="text-gray-700 leading-relaxed">
              At <span className="font-orbitron">3pt<span className="text-3pt-orange">.bot</span></span>, we&apos;re on a mission to build the most comprehensive basketball card database in the world. Whether you&apos;re a seasoned collector or just getting started, we provide the tools and information you need to track, value, and enjoy your collection.
            </p>
          </section>

          {/* Technology Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-3pt-orange mr-2">🤖</span>
              Powered by Technology
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <span className="font-orbitron">3pt<span className="text-3pt-orange">.bot</span></span> leverages cutting-edge AI and machine learning to help organize, categorize, and describe our ever-growing card database. Our intelligent systems help us process new releases faster and provide richer, more detailed information about each card.
            </p>
            <p className="text-gray-700 leading-relaxed">
              But technology is just a tool—at our core, we&apos;re collectors helping collectors. Every piece of information is reviewed, refined, and enhanced by real humans who love the game.
            </p>
          </section>

          {/* Mailing List Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-3pt-green mr-2">📬</span>
              Join Our Mailing List
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Stay up-to-date with the latest releases, set reviews, and collecting tips delivered straight to your inbox.
            </p>
            <div className="bg-gradient-to-r from-3pt-green to-green-600 text-white rounded-lg p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-grow px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-3pt-orange bg-gradient-to-r from-white to-gray-100"
                />
                <button
                  type="button"
                  className="bg-3pt-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors whitespace-nowrap"
                >
                  Subscribe
                </button>
              </div>
              <p className="text-sm text-white/80 mt-3">
                Get access to our top 10 daily and weekly reports!
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-3pt-orange mr-2">✉️</span>
              Get in Touch
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Have questions, suggestions, or feedback? We&apos;d love to hear from you! We&apos;re constantly working to improve <span className="font-orbitron">3pt<span className="text-3pt-orange">.bot</span></span> and your input helps shape the future of our platform.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You can reach us through any of our social media platforms listed in the footer below, including Twitter, Facebook, Instagram, and YouTube.
            </p>
          </section>
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-3pt-green mb-2">{formatNumber(stats.cards)}</div>
            <div className="text-sm text-gray-600">Cards Cataloged</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-3pt-green mb-2">{formatNumber(stats.sets)}</div>
            <div className="text-sm text-gray-600">Sets Documented</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-3pt-green mb-2">{formatNumber(stats.players)}</div>
            <div className="text-sm text-gray-600">Players Featured</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-3pt-green mb-2">{formatNumber(stats.releases)}</div>
            <div className="text-sm text-gray-600">Releases Tracked</div>
          </div>
        </div>
      </main>

      <div className="max-w-4xl mx-auto px-6 w-full">
        <Footer />
      </div>
    </div>
  );
}

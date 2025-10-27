import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About Us - footy.bot",
  description: "Learn about footy.bot, your ultimate resource for soccer card information, collection management, and market insights.",
  openGraph: {
    title: "About Us - footy.bot",
    description: "Learn about footy.bot, your ultimate resource for soccer card information.",
    url: "https://www.footy.bot/about",
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 w-full pt-6">
        <Header />
      </div>

      <main className="flex-grow max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-gray-900 mb-4">
            About <span className="text-footy-green">footy</span><span className="text-footy-orange">.bot</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your comprehensive companion for soccer card collecting, powered by passion for the beautiful game.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 space-y-8">
          {/* Mission Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-footy-green mr-2">⚽</span>
              Our Mission
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>, we&apos;re on a mission to build the most comprehensive and accessible soccer card database in the world. Whether you&apos;re a seasoned collector or just getting started, we provide the tools and information you need to track, value, and enjoy your collection.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We believe that every card tells a story—from rookie sensations to legendary moments on the pitch. Our goal is to help collectors discover, understand, and celebrate these stories.
            </p>
          </section>

          {/* What We Offer Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-footy-orange mr-2">🎯</span>
              What We Offer
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-footy-green font-bold mr-3 mt-1">•</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Comprehensive Card Database</h3>
                  <p className="text-gray-700">Browse thousands of soccer cards from Panini, Topps, and more, with detailed information about players, sets, and releases.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-footy-green font-bold mr-3 mt-1">•</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Release Information</h3>
                  <p className="text-gray-700">Stay up-to-date with the latest card releases, including set details, checklists, and product information.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-footy-green font-bold mr-3 mt-1">•</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Educational Content</h3>
                  <p className="text-gray-700">Learn about the hobby through our blog posts, set reviews, and collecting guides written by passionate fans.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-footy-green font-bold mr-3 mt-1">•</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Market Insights</h3>
                  <p className="text-gray-700">Access curated eBay listings to help you understand current market values and find cards for your collection.</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Our Story Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-footy-green mr-2">📖</span>
              Our Story
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span> was born from a simple need: a better way to track and discover soccer cards. As collectors ourselves, we found existing resources fragmented and difficult to navigate. We wanted a single destination where the global football community could come together to celebrate the hobby.
            </p>
            <p className="text-gray-700 leading-relaxed">
              What started as a passion project has grown into a comprehensive platform serving collectors worldwide. We&apos;re constantly expanding our database, improving our tools, and listening to our community to make <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span> the best it can be.
            </p>
          </section>

          {/* Technology Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-footy-orange mr-2">🤖</span>
              Powered by Technology
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span> leverages cutting-edge AI and machine learning to help organize, categorize, and describe our ever-growing card database. Our intelligent systems help us process new releases faster and provide richer, more detailed information about each card.
            </p>
            <p className="text-gray-700 leading-relaxed">
              But technology is just a tool—at our core, we&apos;re collectors helping collectors. Every piece of information is reviewed, refined, and enhanced by real humans who love the beautiful game.
            </p>
          </section>

          {/* Community Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-footy-green mr-2">🤝</span>
              Join Our Community
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Whether you&apos;re chasing rookie autographs, building rainbow parallels, or just love the thrill of the rip, <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span> is here for you. We&apos;re building more than just a database—we&apos;re building a community.
            </p>
            <div className="bg-gradient-to-r from-footy-green to-green-600 text-white rounded-lg p-6 text-center">
              <p className="font-semibold mb-3">Ready to start your soccer card journey?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/cards"
                  className="bg-white text-footy-green px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Browse Cards
                </Link>
                <Link
                  href="/releases"
                  className="bg-footy-orange text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  View Releases
                </Link>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-footy-orange mr-2">✉️</span>
              Get in Touch
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Have questions, suggestions, or feedback? We&apos;d love to hear from you! We&apos;re constantly working to improve <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span> and your input helps shape the future of our platform.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can reach us through any of our social media platforms listed in the footer below, including Twitter, Facebook, Instagram, and YouTube.
            </p>
            <p className="text-gray-700 leading-relaxed text-sm text-gray-600">
              While we&apos;re a growing platform and may not be able to respond to every message immediately, we read and consider all feedback as we continue to develop new features and expand our database.
            </p>
          </section>
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-footy-green mb-2">1000+</div>
            <div className="text-sm text-gray-600">Cards Cataloged</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-footy-green mb-2">50+</div>
            <div className="text-sm text-gray-600">Sets Documented</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-footy-green mb-2">100+</div>
            <div className="text-sm text-gray-600">Players Featured</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-footy-green mb-2">∞</div>
            <div className="text-sm text-gray-600">Passion for the Game</div>
          </div>
        </div>
      </main>

      <div className="max-w-4xl mx-auto px-6 w-full">
        <Footer />
      </div>
    </div>
  );
}

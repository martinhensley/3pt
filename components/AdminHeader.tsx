"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="bg-gradient-to-r from-footy-green to-green-700 text-white shadow-lg rounded-xl">
      <div className="px-6 py-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <span>footy<span className="text-footy-orange">.bot</span></span>
            </Link>
          </h1>
        </div>

        {/* Navigation menu */}
        <nav className="flex justify-center items-center gap-6 border-t border-green-600 pt-6">
          <Link
            href="/cards"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Cards
          </Link>
          <Link
            href="/checklists"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Checklists
          </Link>
          <Link
            href="/comps"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Comps
          </Link>
          <Link
            href="/posts"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Posts
          </Link>
          <Link
            href="/releases"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Releases
          </Link>
        </nav>

        {/* Admin menu - only show if user is authenticated */}
        {session?.user && (
          <div className="flex justify-center items-center gap-6 mt-2 pt-2">
            <Link
              href="/admin"
              className="text-footy-orange hover:text-white transition-colors text-sm md:text-base font-bold"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/posts"
              className="text-footy-orange hover:text-white transition-colors text-sm md:text-base font-bold"
            >
              Manage Posts
            </Link>
            <Link
              href="/admin/releases"
              className="text-footy-orange hover:text-white transition-colors text-sm md:text-base font-bold"
            >
              Manage Releases
            </Link>
            <Link
              href="/admin/cards"
              className="text-footy-orange hover:text-white transition-colors text-sm md:text-base font-bold"
            >
              Manage Cards
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-footy-orange hover:text-white transition-colors text-sm md:text-base font-bold"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

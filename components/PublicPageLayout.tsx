"use client";

import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import EbayAd from "./EbayAd";
import EbayAdHorizontal from "./EbayAdHorizontal";
import Breadcrumb from "./Breadcrumb";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface PublicPageLayoutProps {
  // Ad configuration
  leftAdQuery: string;
  leftAdTitle: string;
  rightAdQuery: string;
  rightAdTitle: string;
  horizontalAdQuery?: string;
  horizontalAdTitle?: string;

  // Header configuration
  showBackButton?: boolean;

  // Breadcrumbs
  breadcrumbs?: BreadcrumbItem[];

  // Loading and error states
  loading?: boolean;
  error?: string;

  // Page content
  children: ReactNode;
}

export default function PublicPageLayout({
  leftAdQuery,
  leftAdTitle,
  rightAdQuery,
  rightAdTitle,
  horizontalAdQuery,
  horizontalAdTitle,
  showBackButton = false,
  breadcrumbs,
  loading = false,
  error,
  children,
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-2 md:px-4 pt-6 pb-12">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query={leftAdQuery} limit={3} title={leftAdTitle} />
        </aside>

        {/* Main Content */}
        <main className="flex-grow max-w-5xl space-y-6">
          <Header showBackButton={showBackButton} rounded={true} />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
                <p className="text-gray-600 mb-8">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {breadcrumbs && <Breadcrumb items={breadcrumbs} />}

              {children}

              {horizontalAdQuery && horizontalAdTitle && (
                <EbayAdHorizontal
                  query={horizontalAdQuery}
                  limit={4}
                  title={horizontalAdTitle}
                />
              )}

              <Footer rounded={true} />
            </>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query={rightAdQuery} limit={3} title={rightAdTitle} />
        </aside>
      </div>
    </div>
  );
}

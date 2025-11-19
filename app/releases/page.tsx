"use client";

import Link from "next/link";
import Image from "next/image";
import PublicPageLayout from "@/components/PublicPageLayout";
import { useEffect, useState } from "react";

interface Release {
  id: string;
  name: string;
  slug: string;
  year: number | null;
  summary: string | null;
  releaseDate: string | null;
  createdAt: string;
  manufacturer: {
    id: string;
    name: string;
  };
  images: { id: string; url: string }[];
}

export default function ReleasesIndex() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/releases")
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array
        setReleases(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch releases:", error);
        setReleases([]);
        setLoading(false);
      });
  }, []);

  return (
    <PublicPageLayout
      leftAdQuery="basketball cards"
      leftAdTitle="Latest Basketball Cards"
      rightAdQuery="basketball autographs"
      rightAdTitle="Basketball Autographs"
      horizontalAdQuery="basketball memorabilia"
      horizontalAdTitle="More Basketball Collectibles"
      loading={loading}
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-footy-green mb-2">
          All Releases
        </h1>
        <p className="text-gray-600">
          Browse our complete collection of basketball card releases
        </p>
      </div>

      {releases.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-white rounded-lg shadow-lg p-12 max-w-2xl mx-auto transition-colors duration-300">
            <h2 className="text-3xl font-bold text-footy-green mb-4">
              No Releases Yet
            </h2>
            <p className="text-gray-600">
              Check back soon for the latest basketball card releases!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {releases.map((release) => {
            const title = `${release.year || ''} ${release.manufacturer.name} ${release.name}`.trim();
            return (
              <Link
                key={release.id}
                href={`/releases/${release.slug}`}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {release.images[0] && (
                  <div className="relative w-full bg-gray-100">
                    <Image
                      src={release.images[0].url}
                      alt={title}
                      width={800}
                      height={600}
                      className="w-full h-auto"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}

                <div className={`p-6 flex-grow flex flex-col ${!release.images[0] ? "min-h-[400px]" : ""}`}>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <span className="bg-footy-green text-white px-2 py-1 rounded-full font-semibold text-xs">
                      Release
                    </span>
                    {release.releaseDate && (
                      <>
                        <span className="text-gray-500">•</span>
                        <time
                          dateTime={new Date(release.releaseDate).toISOString()}
                          className="text-gray-500"
                        >
                          {new Date(release.releaseDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      </>
                    )}
                  </div>

                  <h2 className={`font-bold text-footy-green mb-3 ${
                    release.images[0] ? "text-xl line-clamp-2" : "text-2xl line-clamp-4"
                  }`}>
                    {title}
                  </h2>

                  {release.summary && (
                    <p className={`text-gray-600 mb-4 flex-grow ${
                      release.images[0] ? "line-clamp-3" : "line-clamp-[12]"
                    }`}>{release.summary}</p>
                  )}

                  <div className="mt-auto text-footy-orange font-semibold">
                    View release →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PublicPageLayout>
  );
}

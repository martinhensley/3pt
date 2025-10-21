"use client";

import { useEffect, useState } from "react";

interface Release {
  id: string;
  name: string;
  year: string;
  manufacturer: {
    id: string;
    name: string;
  };
  sets: Array<{
    id: string;
    name: string;
  }>;
}

interface Set {
  id: string;
  name: string;
  release: {
    id: string;
    name: string;
    year: string;
    manufacturer: {
      id: string;
      name: string;
    };
  };
  _count: {
    cards: number;
  };
}

interface ReleaseSelectProps {
  onReleaseSelected: (releaseId: string, release?: Release) => void;
  value?: string;
  label?: string;
}

export function ReleaseSelect({
  onReleaseSelected,
  value,
  label = "Select Release",
}: ReleaseSelectProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/library/releases")
      .then((res) => res.json())
      .then((data) => {
        setReleases(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch releases:", error);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const releaseId = e.target.value;
    const release = releases.find((r) => r.id === releaseId);
    onReleaseSelected(releaseId, release);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {label}
      </label>
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={loading}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900 disabled:opacity-50"
      >
        <option value="">
          {loading ? "Loading releases..." : "-- Select a Release --"}
        </option>
        {releases.map((release) => (
          <option key={release.id} value={release.id}>
            {release.manufacturer.name} - {release.name} ({release.year}) [
            {release.sets.length} sets]
          </option>
        ))}
      </select>
      {releases.length === 0 && !loading && (
        <p className="mt-1 text-xs text-gray-600">
          No releases found. Create one using &quot;Analyze Release&quot; first.
        </p>
      )}
    </div>
  );
}

interface SetSelectProps {
  releaseId: string;
  onSetSelected: (setId: string, set?: Set) => void;
  value?: string;
  label?: string;
}

export function SetSelect({
  releaseId,
  onSetSelected,
  value,
  label = "Select Set",
}: SetSelectProps) {
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!releaseId) {
      setSets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/library/sets?releaseId=${releaseId}`)
      .then((res) => res.json())
      .then((data) => {
        setSets(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch sets:", error);
        setLoading(false);
      });
  }, [releaseId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const setId = e.target.value;
    const set = sets.find((s) => s.id === setId);
    onSetSelected(setId, set);
  };

  if (!releaseId) {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
        <select
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
        >
          <option>Select a release first</option>
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {label}
      </label>
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={loading}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900 disabled:opacity-50"
      >
        <option value="">
          {loading ? "Loading sets..." : "-- Select a Set --"}
        </option>
        {sets.map((set) => (
          <option key={set.id} value={set.id}>
            {set.name} ({set._count.cards} cards)
          </option>
        ))}
      </select>
      {sets.length === 0 && !loading && (
        <p className="mt-1 text-xs text-gray-600">
          No sets found in this release. Create one using &quot;Analyze
          Set&quot; first.
        </p>
      )}
    </div>
  );
}

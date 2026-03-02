// client/src/pages/Badges.jsx
import React, { useEffect, useMemo, useState } from "react";
import BadgeCard from "../components/gamification/BadgeCard";
import { BadgesAPI } from "../api/badges.api";

const TYPE_OPTIONS = [
  { key: "ALL", label: "All" },
  { key: "TRIP_COUNT", label: "Trip Count" },
  { key: "TOTAL_DISTANCE", label: "Total Distance" },
  { key: "TOTAL_CO2_SAVED", label: "CO₂ Saved" },
];

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-sm border transition",
        active
          ? "bg-green-600 text-white border-green-600"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function Badges() {
  const [badges, setBadges] = useState([]);
  const [activeType, setActiveType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBadges() {
    setLoading(true);
    setError("");
    try {
      const data = await BadgesAPI.getAllBadges();

      // Accept multiple possible backend response shapes safely:
      // - array
      // - { badges: [...] }
      // - { data: [...] }
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.badges)
        ? data.badges
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setBadges(list);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load badges. Please try again."
      );
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBadges();
  }, []);

  const filteredBadges = useMemo(() => {
    if (activeType === "ALL") return badges;
    return badges.filter((b) => b?.type === activeType);
  }, [badges, activeType]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Badges</h1>
          <p className="text-gray-600 mt-1">
            Earn rewards for consistent sustainable commutes.
          </p>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.key}
                active={activeType === opt.key}
                onClick={() => setActiveType(opt.key)}
              >
                {opt.label}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="mt-6">
          {loading && (
            <div className="py-10 text-center text-gray-600">
              Loading badges...
            </div>
          )}

          {!loading && error && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Couldn’t load badges
              </h3>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
              <button
                type="button"
                onClick={loadBadges}
                className="mt-4 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredBadges.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                No badges found
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Try changing the filter or check again later.
              </p>
            </div>
          )}

          {!loading && !error && filteredBadges.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBadges.map((badge) => (
                <BadgeCard key={badge?._id || badge?.id} badge={badge} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
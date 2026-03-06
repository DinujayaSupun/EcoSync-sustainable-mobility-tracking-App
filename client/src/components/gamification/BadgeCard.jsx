// client/src/components/gamification/BadgeCard.jsx
import React from "react";

function typeLabel(type) {
  if (type === "TRIP_COUNT") return "Trip Count";
  if (type === "TOTAL_DISTANCE") return "Total Distance";
  if (type === "TOTAL_CO2_SAVED") return "CO₂ Saved";
  return type || "Unknown";
}

function typePillClass(type) {
  if (type === "TRIP_COUNT") return "bg-blue-50 text-blue-700 border-blue-100";
  if (type === "TOTAL_DISTANCE")
    return "bg-green-50 text-green-700 border-green-100";
  if (type === "TOTAL_CO2_SAVED")
    return "bg-purple-50 text-purple-700 border-purple-100";
  return "bg-gray-50 text-gray-700 border-gray-100";
}

function thresholdText(type, threshold) {
  const t = Number(threshold);
  if (!Number.isFinite(t)) return "Threshold not set";
  if (type === "TRIP_COUNT") return `Earn after ${t} trips`;
  if (type === "TOTAL_DISTANCE") return `Earn after ${t} km total`;
  if (type === "TOTAL_CO2_SAVED") return `Earn after ${t} kg CO₂ saved`;
  return `Threshold: ${t}`;
}

export default function BadgeCard({ badge, earned = false }) {
  const imageUrl = badge?.imageUrl || badge?.image || badge?.iconUrl || "";

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition border ${earned ? "border-green-400" : "border-gray-100"}`}>
      {/* Position relative so the "Earned" banner can overlay the image */}
      <div className="h-40 bg-gray-100 overflow-hidden relative">
        {earned && (
          <span className="absolute top-2 left-2 z-10 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            ✓ Earned
          </span>
        )}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={badge?.name || "Badge"}
            className={`w-full h-full object-cover transition ${earned ? "" : "grayscale opacity-50"}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
            No Image
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
            {badge?.name || "Untitled Badge"}
          </h3>
          <span
            className={`shrink-0 text-xs px-2 py-1 rounded-full border ${typePillClass(
              badge?.type
            )}`}
            title={badge?.type}
          >
            {typeLabel(badge?.type)}
          </span>
        </div>

        {badge?.description ? (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {badge.description}
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-500 italic">
            No description provided.
          </p>
        )}

        <div className="mt-3 text-sm text-gray-700">
          <span className="font-medium">Criteria:</span>{" "}
          {thresholdText(badge?.type, badge?.threshold)}
        </div>
      </div>
    </div>
  );
}
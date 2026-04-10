// client/src/components/gamification/BadgeCard.jsx
import React, { useMemo, useState } from "react";

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

export default function BadgeCard({ badge, earned = false, onClick }) {
  const imageUrl = badge?.imageUrl || badge?.image || badge?.iconUrl || "";
  const [imgFailed, setImgFailed] = useState(false);
  const initials = String(badge?.name || "B")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");

  const canShowImage = Boolean(imageUrl) && !imgFailed;

  const fallbackTone = useMemo(() => {
    if (badge?.type === "TRIP_COUNT") return "from-blue-100 to-cyan-200 text-blue-800";
    if (badge?.type === "TOTAL_DISTANCE") return "from-green-100 to-emerald-200 text-emerald-800";
    if (badge?.type === "TOTAL_CO2_SAVED") return "from-lime-100 to-teal-200 text-teal-800";
    return "from-slate-100 to-slate-200 text-slate-700";
  }, [badge?.type]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative w-full overflow-hidden rounded-3xl border bg-white text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80",
        earned ? "border-emerald-300" : "border-slate-200",
      ].join(" ")}
      aria-label={`Open badge details for ${badge?.name || "badge"}`}
    >
      <div
        className={[
          "absolute inset-x-0 top-0 h-1.5",
          earned
            ? "bg-linear-to-r from-emerald-400 via-lime-400 to-teal-500"
            : "bg-linear-to-r from-slate-300 via-slate-200 to-slate-300",
        ].join(" ")}
      />

      <div className="relative h-36 overflow-hidden bg-slate-100">
        {canShowImage ? (
          <img
            src={imageUrl}
            alt={badge?.name || "Badge"}
            className={[
              "h-full w-full object-cover transition duration-500 group-hover:scale-105",
              earned ? "" : "grayscale opacity-80",
            ].join(" ")}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            loading="lazy"
          />
        ) : (
          <div
            className={[
              "flex h-full w-full items-center justify-center bg-linear-to-br text-3xl font-black tracking-wide",
              fallbackTone,
            ].join(" ")}
          >
            {initials || "★"}
          </div>
        )}

        <span
          className={[
            "absolute right-3 top-3 z-10 rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm",
            earned
              ? "border-emerald-200 bg-emerald-500 text-white"
              : "border-slate-300 bg-white text-slate-700",
          ].join(" ")}
        >
          {earned ? "Earned" : "Locked"}
        </span>

        <div className="absolute -bottom-7 left-1/2 z-10 h-14 w-14 -translate-x-1/2 rounded-full bg-white shadow-lg" />
        <div
          className={[
            "absolute -bottom-6 left-1/2 z-20 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-2 text-lg",
            earned
              ? "border-amber-200 bg-linear-to-br from-amber-200 to-yellow-500 text-amber-900"
              : "border-slate-300 bg-linear-to-br from-slate-200 to-slate-400 text-slate-700",
          ].join(" ")}
        >
          ★
        </div>
      </div>

      <div className="px-5 pb-5 pt-10">
        <div className="mb-3 flex justify-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${typePillClass(
              badge?.type
            )}`}
            title={badge?.type}
          >
            {typeLabel(badge?.type)}
          </span>
        </div>

        <h3 className="text-center text-lg font-extrabold tracking-tight text-slate-900">
          {badge?.name || "Untitled Badge"}
        </h3>

        {badge?.description ? (
          <p className="mt-2 line-clamp-2 text-center text-sm text-slate-600">
            {badge.description}
          </p>
        ) : (
          <p className="mt-2 text-center text-sm italic text-slate-500">
            No description provided.
          </p>
        )}

        <div
          className={[
            "mt-4 rounded-xl border px-3 py-2 text-center text-sm",
            earned
              ? "border-emerald-100 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-slate-50 text-slate-700",
          ].join(" ")}
        >
          <span className="font-semibold">Criteria:</span> {thresholdText(badge?.type, badge?.threshold)}
        </div>
      </div>
    </button>
  );
}
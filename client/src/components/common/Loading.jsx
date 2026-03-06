// client/src/gamification/components/common/Loading.jsx

import React from "react";

export default function Loading({ label = "Loading..." }) {
  return (
    <div className="w-full flex items-center justify-center py-10">
      <div className="flex items-center gap-3 bg-white shadow-sm rounded-xl px-5 py-4 border border-gray-100">
        <div className="w-4 h-4 rounded-full animate-pulse bg-gray-400" />
        <p className="text-gray-700 text-sm">{label}</p>
      </div>
    </div>
  );
}
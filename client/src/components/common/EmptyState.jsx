// client/src/gamification/components/common/EmptyState.jsx

import React from "react";

export default function EmptyState({
  title = "Nothing here yet",
  message = "No data to show.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="w-full flex items-center justify-center py-10">
      <div className="max-w-lg w-full bg-white shadow-sm rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>

        {actionLabel && typeof onAction === "function" && (
          <button
            onClick={onAction}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium"
            type="button"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
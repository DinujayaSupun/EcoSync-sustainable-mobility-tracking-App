// client/src/gamification/components/common/ErrorState.jsx

import React from "react";

export default function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
  onRetry,
}) {
  return (
    <div className="w-full flex items-center justify-center py-10">
      <div className="max-w-lg w-full bg-white shadow-sm rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>

        {typeof onRetry === "function" && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
            type="button"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
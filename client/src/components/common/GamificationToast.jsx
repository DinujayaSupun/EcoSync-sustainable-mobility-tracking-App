export default function GamificationToast({ toast }) {
  if (!toast) return null;

  const tone = toast.type || "info";

  const toneClass =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-cyan-200 bg-cyan-50 text-cyan-800";

  return (
    <div
      className={[
        "fixed right-4 top-22 z-3000 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
        toneClass,
      ].join(" ")}
    >
      {toast.message}
    </div>
  );
}

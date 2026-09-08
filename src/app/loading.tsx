import { LoadingSpinner } from "@/components/ui/loading-indicator";

export default function Loading() {
  return (
    <div
      className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-slate-50 px-6"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
        <span className="grid size-14 place-items-center rounded-full bg-teal-50 text-teal-700">
          <LoadingSpinner className="size-7" />
        </span>
        <p className="mt-4 text-sm font-semibold text-slate-800">
          Loading your health workspace…
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Your information is being prepared securely.
        </p>
      </div>
    </div>
  );
}

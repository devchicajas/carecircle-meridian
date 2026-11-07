export function LoadingBlock({ label = "Loading Meridian records…" }: { label?: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <p className="text-sm text-ink-500">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-3xl bg-white/70"
          />
        ))}
      </div>
    </div>
  );
}

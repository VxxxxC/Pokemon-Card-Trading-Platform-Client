export function UserTradingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-hidden="true">
      <div className="bg-bg-card border border-white/5 p-4 rounded-2xl h-24" />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="h-5 w-40 bg-bg-card rounded-lg" />
          <div className="h-9 w-full sm:w-72 bg-bg-card rounded-xl" />
        </div>
        <div className="h-9 w-full sm:w-64 bg-bg-card rounded-xl" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-bg-card rounded-2xl border border-white/5 h-28"
          />
        ))}
      </div>
    </div>
  );
}

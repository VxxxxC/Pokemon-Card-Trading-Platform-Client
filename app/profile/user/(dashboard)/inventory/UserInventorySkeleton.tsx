export function UserInventorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-3 h-20"
          />
        ))}
      </div>

      <div className="bg-bg-card border border-[rgba(237,232,224,0.08)] p-4 rounded-2xl h-24" />

      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] h-64" />
    </div>
  );
}

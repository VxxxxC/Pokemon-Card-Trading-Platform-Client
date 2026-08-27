export function UserInventorySkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] animate-pulse"
      aria-hidden="true"
    >
      <div className="flex divide-x divide-[rgba(237,232,224,0.06)] border-b border-[rgba(237,232,224,0.06)]">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex-1 px-3 py-3 h-14 bg-bg-elevated/20" />
        ))}
      </div>
      <div className="px-4 py-3 border-b border-[rgba(237,232,224,0.06)]">
        <div className="h-9 rounded-lg bg-bg-elevated/30" />
      </div>
      <div className="px-4 py-3 border-b border-[rgba(237,232,224,0.06)] h-10 bg-bg-elevated/20" />
      <div className="px-4 py-6 h-48 bg-bg-elevated/10" />
    </div>
  );
}

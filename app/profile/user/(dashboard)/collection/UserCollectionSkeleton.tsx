export function UserCollectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      <section>
        <div className="bg-[#26211C] rounded-2xl border border-[rgba(212,165,116,0.20)] p-5">
          <div className="h-4 w-48 rounded bg-white/5 mb-4" />
          <div className="h-10 w-56 rounded bg-white/5 mb-3" />
          <div className="h-4 w-72 rounded bg-white/5 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-[#17130f] rounded-xl px-3 py-2.5 border border-white/[0.02] h-16"
              />
            ))}
          </div>
        </div>
      </section>

      <div className="h-10 rounded-[10px] bg-white/5" />

      <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] h-80" />

      <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] h-48" />
    </div>
  );
}

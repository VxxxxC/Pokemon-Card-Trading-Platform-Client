export function MerchantOverviewSkeleton() {
  return (
    <>
      <section
        className="relative mb-5 rounded-2xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] animate-pulse"
        aria-hidden="true"
      >
        <div className="h-24 bg-linear-to-r from-[#2a2318] via-[rgba(212,165,116,0.12)] to-[#2a2318]" />
        <div className="px-5 pb-5">
          <div className="w-20 h-20 rounded-full -mt-10 mb-3 bg-white/5" />
          <div className="h-7 w-48 rounded bg-white/5 mb-2" />
          <div className="h-4 w-56 rounded bg-white/5" />
          <div className="flex gap-4 mt-4 pt-3 border-t border-[rgba(237,232,224,0.06)]">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-16 rounded bg-white/5" />
                <div className="h-5 w-24 rounded bg-white/5" />
              </div>
            ))}
          </div>
          <div className="h-16 mt-4 rounded bg-white/5" />
          <div className="h-8 mt-4 rounded bg-white/5" />
          <div className="flex gap-2 mt-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-8 w-24 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      </section>

      <section className="mb-5" aria-hidden="true">
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 space-y-5 animate-pulse">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-white/5" />
              <div className="h-7 w-28 rounded bg-white/5" />
            </div>
            <div className="space-y-2 pl-4 border-l border-white/5">
              <div className="h-3 w-16 rounded bg-white/5" />
              <div className="h-7 w-20 rounded bg-white/5" />
            </div>
          </div>
          <div className="h-11 rounded-xl bg-white/5" />
        </div>
      </section>

      <section className="mb-5 space-y-3" aria-hidden="true">
        <div className="h-5 w-28 rounded bg-white/5" />
        <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
      </section>

      <section className="space-y-3" aria-hidden="true">
        <div className="h-5 w-36 rounded bg-white/5" />
        <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
      </section>
    </>
  );
}

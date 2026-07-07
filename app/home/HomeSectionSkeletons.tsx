export function WishlistSectionSkeleton() {
  return (
    <section aria-hidden="true" className="mb-8">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-white/5 animate-pulse" />
          <div className="h-4 w-56 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-4 w-12 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="shrink-0 w-36 md:w-48 rounded-xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)]"
          >
            <div className="w-full aspect-5/7 bg-white/5 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
              <div className="h-2.5 w-1/2 rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MerchantSectionSkeleton() {
  return (
    <section aria-hidden="true" className="mb-8 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-56 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-3 animate-pulse"
          >
            <div className="w-full aspect-[5/7] rounded-lg bg-white/5 mb-2.5" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/5" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
              <div className="h-5 w-1/3 rounded bg-white/5 mt-3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function C2cSectionSkeleton() {
  return (
    <section aria-hidden="true" className="mb-8 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-2">
          <div className="h-6 w-44 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-52 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="shrink-0 w-[175px] sm:w-[195px] md:w-[225px] rounded-[14px] border border-[rgba(237,232,224,0.08)] bg-[#26211C] overflow-hidden animate-pulse"
          >
            <div className="w-full aspect-[3/4] bg-white/5" />
            <div className="p-3.5 space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/5" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
              <div className="h-5 w-1/3 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

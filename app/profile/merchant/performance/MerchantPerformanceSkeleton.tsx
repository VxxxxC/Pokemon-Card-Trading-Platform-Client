export function MerchantPerformanceSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="space-y-6 animate-pulse p-4 md:p-6 bg-bg-page min-h-screen text-text-primary"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/5" />
        <div className="h-7 w-48 rounded bg-white/5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="w-full bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5"
          >
            <div className="h-4 w-28 rounded bg-white/5 mb-3" />
            <div className="h-8 w-36 rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 space-y-4">
        <div className="flex justify-between">
          <div className="h-5 w-40 rounded bg-white/5" />
          <div className="h-9 w-[125px] rounded-xl bg-white/5" />
        </div>
        <div className="h-72 w-full rounded bg-white/5" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5 border-t border-white/5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 rounded-xl bg-white/5" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 space-y-3"
          >
            <div className="h-5 w-32 rounded bg-white/5" />
            {Array.from({ length: 5 }).map((__, rowIndex) => (
              <div key={rowIndex} className="h-12 rounded bg-white/5" />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

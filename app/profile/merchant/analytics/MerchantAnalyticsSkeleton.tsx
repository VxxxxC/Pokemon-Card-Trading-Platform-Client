export function MerchantAnalyticsSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="space-y-6 animate-pulse p-4 md:p-6"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/5" />
        <div className="h-7 w-48 rounded bg-white/5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="bg-[#26211C] rounded-2xl border border-white/5 p-5"
          >
            <div className="h-4 w-28 rounded bg-white/5 mb-3" />
            <div className="h-8 w-36 rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="bg-[#26211C] rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="flex justify-between">
          <div className="h-5 w-24 rounded bg-white/5" />
          <div className="h-9 w-[125px] rounded-xl bg-white/5" />
        </div>
        <div className="h-72 w-full rounded bg-white/5" />
      </div>

      <div className="bg-[#26211C] rounded-2xl border border-white/5 p-5 space-y-3">
        <div className="h-5 w-32 rounded bg-white/5" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-12 rounded bg-white/5" />
        ))}
      </div>
    </section>
  );
}

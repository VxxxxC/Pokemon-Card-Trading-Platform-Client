import { PortfolioStatsSkeleton } from "@/app/components/shared/PortfolioSkeletons";

export function UserOverviewSkeleton() {
  return (
    <>
      <section
        className="relative mb-5 mt-4 rounded-2xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] shadow-md animate-pulse"
        aria-hidden="true"
      >
        <div className="h-20 bg-gradient-to-r from-[#2e2925] via-[rgba(212,165,116,0.08)] to-[#2e2925]" />
        <div className="px-5 pb-5">
          <div className="w-20 h-20 rounded-full -mt-10 mb-3 bg-white/5" />
          <div className="h-7 w-40 rounded bg-white/5 mb-2" />
          <div className="h-4 w-56 rounded bg-white/5" />
          <div className="flex gap-5 mt-4 pt-3 border-t border-[rgba(237,232,224,0.06)]">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-16 rounded bg-white/5" />
                <div className="h-5 w-24 rounded bg-white/5" />
              </div>
            ))}
          </div>
          <div className="h-12 mt-5 rounded bg-white/5" />
        </div>
      </section>

      <section className="mb-6" aria-hidden="true">
        <PortfolioStatsSkeleton />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] lg:gap-8 items-start gap-6">
        <div className="space-y-6">
          <div className="h-48 rounded-2xl bg-white/5 animate-pulse lg:hidden" />
          <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />
          <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        </div>
        <div className="hidden lg:block h-48 rounded-2xl bg-white/5 animate-pulse" />
      </div>
    </>
  );
}

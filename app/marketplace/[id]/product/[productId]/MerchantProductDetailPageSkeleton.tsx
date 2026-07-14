export function MerchantProductDetailPageSkeleton() {
  return (
    <div className="flex-1 w-full flex flex-col bg-[#17130f]">
      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 lg:px-8 py-6 pb-32 animate-fadeIn">
        <div className="h-8 w-16 rounded-lg bg-white/5 animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 items-start">
          <section className="lg:col-span-5 space-y-3.5 mb-6 lg:mb-0">
            <div className="w-full aspect-[3/4] bg-[#26211C] rounded-2xl animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] bg-[#26211C] rounded-xl animate-pulse"
                />
              ))}
            </div>
          </section>
          <section className="lg:col-span-7 space-y-5">
            <div className="h-8 w-40 rounded bg-white/5 animate-pulse" />
            <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />
            <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
          </section>
        </div>
      </main>
    </div>
  );
}

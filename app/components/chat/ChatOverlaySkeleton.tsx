"use client";

export function ChatOverlaySkeleton() {
  return (
    <>
      <div
        className="hidden lg:flex fixed bottom-6 right-6 z-[500] w-[640px] h-[460px] bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-2xl overflow-hidden animate-pulse"
        aria-hidden="true"
      >
        <div className="w-[200px] border-r border-[rgba(237,232,224,0.06)] bg-[#1A1612] p-3 space-y-2">
          <div className="h-8 rounded bg-[#26211C]" />
          <div className="h-8 rounded bg-[#26211C]/70" />
          <div className="h-12 rounded-xl bg-[#26211C]/50" />
          <div className="h-12 rounded-xl bg-[#26211C]/50" />
          <div className="h-12 rounded-xl bg-[#26211C]/50" />
        </div>
        <div className="flex-1 bg-[#17130f] flex items-center justify-center">
          <p className="font-mono text-[11px] text-text-disabled select-none">
            載入聊天室…
          </p>
        </div>
      </div>
      <div
        className="lg:hidden fixed inset-0 z-[500] bg-[#17130f] flex flex-col animate-pulse"
        aria-hidden="true"
      >
        <div className="h-14 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)]" />
        <div className="flex-1 p-3 space-y-2">
          <div className="h-16 rounded-2xl bg-[#26211C]/60" />
          <div className="h-16 rounded-2xl bg-[#26211C]/60" />
          <div className="h-16 rounded-2xl bg-[#26211C]/60" />
        </div>
      </div>
    </>
  );
}

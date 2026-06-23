'use client'

import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F8F9FA] px-4">
      <section className="w-full max-w-lg rounded-2xl border border-[rgba(226,232,240,0.6)] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <p className="font-mono text-[12px] text-[#5F6368]">HKCardVault · Offline</p>
        <h1 className="mt-2 font-sans text-[24px] font-bold text-[#202124]">
          目前處於離線模式
        </h1>
        <p className="mt-3 font-sans text-[14px] leading-relaxed text-[#5F6368]">
          你可以繼續查看已快取嘅卡牌頁面與部分市場資料；出價、付款與託管流程會喺重新連線後恢復。
        </p>
        <div className="mt-5 flex gap-2">
          <Link
            href="/"
            className="inline-flex h-10 min-h-11 items-center rounded-lg bg-[#2563EB] px-4 font-sans text-[14px] font-medium text-white active:scale-[0.98] active:translate-y-px transition-transform"
          >
            返回首頁
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 min-h-11 items-center rounded-lg border border-[rgba(226,232,240,0.6)] px-4 font-sans text-[14px] font-medium text-[#5F6368] active:scale-[0.98] active:translate-y-px transition-transform"
          >
            重新整理
          </button>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type EmailConfirmedClientProps = {
  nextPath: string;
};

export function EmailConfirmedClient({ nextPath }: EmailConfirmedClientProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(nextPath);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [nextPath, router]);

  return (
    <div className="px-3.5 py-5 sm:px-4 space-y-4 text-center">
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(16,185,129,0.12)] text-success text-xl"
        aria-hidden="true"
      >
        ✓
      </div>
      <div className="space-y-2">
        <p className="font-sans text-[16px] font-semibold text-text-primary">
          電郵已確認
        </p>
        <p className="font-sans text-[13px] text-text-secondary leading-relaxed">
          你的帳戶已啟用，正在帶你進入會員中心…
        </p>
      </div>
      <Link
        href={nextPath}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand text-[#17130f] font-sans text-[13px] font-semibold hover:bg-brand-hover transition-colors"
      >
        立即進入
      </Link>
    </div>
  );
}

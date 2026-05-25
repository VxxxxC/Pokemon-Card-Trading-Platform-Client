import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ProfileTabNav } from "@/app/components/profile/ProfileTabNav";
import type { TabItem } from "@/app/components/profile/ProfileTabNav";

const MERCHANT_TABS: TabItem[] = [
  { href: "/profile/merchant",           label: "儀表板",   icon: "📊" },
  { href: "/profile/merchant/inventory", label: "商品管理", icon: "🗂️" },
  { href: "/profile/merchant/sales",     label: "銷售訂單", icon: "🤝" },
  { href: "/profile/merchant/finance",   label: "資金金流", icon: "💰" },
];

const mockMerchant = {
  name:           "田中 Koji",
  shopName:       "KojiTCG Premium",
  handle:         "@koji_tcg",
  avatarSeed:     "merchant-koji-tcg",
  joinDate:       "2023年 11月加入",
  kycVerified:    true,
  stripeConnected: true,
  rating:         4.95,
  reviewCount:    187,
  totalListings:  34,
  monthlyRevenue: 384_600,
};

export default function MerchantProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-10">
        {/* ── Demo Role Banner ──────────────────────────────────────────── */}
        <div className="mt-4 mb-4 flex items-center justify-between px-3 py-2 bg-[rgba(212,165,116,0.06)] border border-brand/20 rounded-xl">
          <span className="font-mono text-[11px] text-brand">
            Demo 模式：商戶 (MERCHANT)
          </span>
          <div className="flex gap-2">
            <Link
              href="/profile/user"
              className="font-mono text-[11px] text-text-secondary hover:text-text-primary border border-[rgba(237,232,224,0.12)] px-2 py-0.5 rounded-md transition-colors"
            >
              一般會員
            </Link>
            <Link
              href="/admin"
              className="font-mono text-[11px] text-text-secondary hover:text-text-primary border border-[rgba(237,232,224,0.12)] px-2 py-0.5 rounded-md transition-colors"
            >
              管理員
            </Link>
          </div>
        </div>

        {/* ── Merchant Hero ─────────────────────────────────────────────── */}
        <section
          className="relative mb-5 rounded-2xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)]"
          aria-labelledby="merchant-hero-name"
        >
          <div className="h-20 bg-linear-to-r from-[#2a2318] via-[rgba(212,165,116,0.12)] to-[#2a2318]" />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-3">
              <div className="relative w-20 h-20 rounded-full border-2 border-bg-card shadow-[0_4px_12px_rgba(0,0,0,0.50)] overflow-hidden shrink-0">
                <Image
                  src={`https://picsum.photos/seed/${mockMerchant.avatarSeed}/80/80`}
                  alt={`${mockMerchant.shopName} 的商舖頭像`}
                  fill
                  className="object-cover"
                />
              </div>
              {/* KYC + Stripe status badges */}
              <div className="flex gap-2 flex-wrap justify-end">
                {mockMerchant.kycVerified && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-success bg-[rgba(16,185,129,0.12)] px-2 py-1 rounded-lg border border-success/20">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    KYC 已驗證
                  </span>
                )}
                {mockMerchant.stripeConnected && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#635bff] bg-[rgba(99,91,255,0.12)] px-2 py-1 rounded-lg border border-[rgba(99,91,255,0.25)]">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Stripe 已連結
                  </span>
                )}
              </div>
            </div>

            <h1 id="merchant-hero-name" className="font-sans font-bold text-[22px] text-text-primary">
              {mockMerchant.shopName}
            </h1>
            <p className="font-mono text-[12px] text-text-secondary mt-0.5">
              {mockMerchant.handle} · {mockMerchant.joinDate}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="font-mono text-[12px] text-text-secondary">
                ★ {mockMerchant.rating} ({mockMerchant.reviewCount} 評)
              </span>
              <span className="font-mono text-[12px] text-text-secondary">
                {mockMerchant.totalListings} 件在售
              </span>
              <span className="font-mono text-[12px] text-brand font-medium">
                本月 ¥{mockMerchant.monthlyRevenue.toLocaleString("zh-TW")}
              </span>
            </div>
          </div>
        </section>

        {/* ── Tab Navigation ─────────────────────────────────────────────── */}
        <ProfileTabNav tabs={MERCHANT_TABS} />

        {/* ── Page Content ───────────────────────────────────────────────── */}
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

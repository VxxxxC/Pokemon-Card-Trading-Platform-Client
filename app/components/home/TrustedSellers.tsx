import Link from "next/link";

// Spec Section 5: Premium Escrow Market — KYC-verified merchant cards with badge system
// TODO [MOCK DATA]: Replace with Supabase query — WHERE account_type='merchant' AND kyc_status='verified', ordered by rating DESC
// TODO [BACKEND]: RLS policy must enforce account_type='merchant' AND kyc_status='verified' for use_authentication=true listings

const verifiedMerchants = [
  {
    id: "PKT-2201-11A",
    name: "渡邊道館",
    avatar: "渡",
    rating: 4.9,
    totalTrades: 312,
    badge: "專業道館主",
    badgeColor: "bg-[rgba(212,165,116,0.20)] text-brand",
    kycVerified: true,
    topCard: "Charizard ex SAR",
    topCardPrice: 45000,
  },
  {
    id: "PKT-3305-22B",
    name: "京都卡牌專門店",
    avatar: "京",
    rating: 4.8,
    totalTrades: 256,
    badge: "認證商戶",
    badgeColor: "bg-[rgba(16,185,129,0.12)] text-success",
    kycVerified: true,
    topCard: "Mewtwo ex SAR",
    topCardPrice: 52000,
  },
  {
    id: "PKT-4408-33C",
    name: "東京TCG市場",
    avatar: "東",
    rating: 4.9,
    totalTrades: 489,
    badge: "殿堂收藏家",
    badgeColor: "bg-[rgba(212,165,116,0.20)] text-brand",
    kycVerified: true,
    topCard: "Umbreon ex SAR",
    topCardPrice: 38000,
  },
  {
    id: "PKT-5510-44D",
    name: "大阪收藏家",
    avatar: "大",
    rating: 4.7,
    totalTrades: 178,
    badge: "認證商戶",
    badgeColor: "bg-[rgba(16,185,129,0.12)] text-success",
    kycVerified: true,
    topCard: "Pikachu AR",
    topCardPrice: 8500,
  },
];

function ShieldCheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function TrustedSellers() {
  return (
    <section className="mb-8" aria-labelledby="sellers-heading">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            id="sellers-heading"
            className="font-sans font-semibold text-[20px] text-text-primary"
          >
            認證商家・鑑定託管保障
          </h2>
          <p className="font-sans text-[11px] text-text-secondary mt-0.5">
            完成 Stripe KYC 核實的專業賣家，支援分段式 Escrow 託管
          </p>
        </div>
        <Link
          href="/marketplace?type=merchant"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {verifiedMerchants.map((seller) => (
          <Link
            key={seller.id}
            href={`/profile/${seller.id}`}
            className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-4 hover:bg-bg-elevated transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[rgba(212,165,116,0.15)] flex items-center justify-center font-sans font-semibold text-[14px] text-brand shrink-0">
                  {seller.avatar}
                </div>
                {/* KYC verification badge icon */}
                {seller.kycVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-bg-card flex items-center justify-center">
                    <ShieldCheckIcon />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[14px] font-medium text-text-primary truncate group-hover:text-brand transition-colors">
                  {seller.name}
                </p>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[11px] text-text-secondary">
                    {seller.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-[4px] ${seller.badgeColor}`}>
                🏅 {seller.badge}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[12px] text-text-primary">
                  ★ {seller.rating}
                </span>
              </div>
            </div>

            {/* Stats + top card */}
            <div className="flex items-center justify-between pt-2 border-t border-[rgba(237,232,224,0.06)]">
              <span className="font-mono text-[11px] text-text-secondary">
                {seller.totalTrades} 筆成交
              </span>
              <span className="font-mono text-[11px] text-text-disabled truncate max-w-[100px]">
                熱銷：{seller.topCard}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";

type EscrowListing = {
  id: string;
  name: string;
  rarity: string;
  price: number;
  image: string;
  merchantName: string;
  merchantBadge: string;
};

// TODO: [database] Only show listings from verified merchants (Stripe Connect onboarding + KYC verified).
// TODO: [server] Enforce RLS: listings.use_authentication=true requires merchant role + verified KYC.
const MOCK_ESCROW_LISTINGS: EscrowListing[] = [
  {
    id: "escrow-1",
    name: "リザードン ex SAR（鑑定託管）",
    rarity: "SAR",
    price: 280000,
    image: "https://picsum.photos/seed/escrow-1/720/560",
    merchantName: "レン精選卡牌",
    merchantBadge: "專業道館主",
  },
  {
    id: "escrow-2",
    name: "ミュウツー ex SAR（鑑定託管）",
    rarity: "SAR",
    price: 145000,
    image: "https://picsum.photos/seed/escrow-2/720/560",
    merchantName: "Akiba市場",
    merchantBadge: "殿堂收藏家",
  },
  {
    id: "escrow-3",
    name: "ピカチュウ AR（鑑定託管）",
    rarity: "AR",
    price: 38500,
    image: "https://picsum.photos/seed/escrow-3/720/560",
    merchantName: "KiraCards",
    merchantBadge: "認證商家",
  },
  {
    id: "escrow-4",
    name: "コライドン ex SAR（鑑定託管）",
    rarity: "SAR",
    price: 188000,
    image: "https://picsum.photos/seed/escrow-4/720/560",
    merchantName: "FutureCards",
    merchantBadge: "專業道館主",
  },
];

export function PremiumEscrowMarket() {
  return (
    <section className="mt-10" aria-labelledby="escrow-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="escrow-heading"
            className="font-sans text-[18px] sm:text-[20px] font-semibold text-text-primary"
          >
            認證商家 · 鑑定託管保障區
          </h2>
          <p className="mt-1 font-sans text-[13px] text-text-secondary max-w-[65ch]">
            僅顯示已完成 KYC 與金流上架驗證的商家商品（示意）。強制 4–6 張實物細節圖，支援分段式託管。
          </p>
        </div>
        <Link
          href="/marketplace"
          className="shrink-0 font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          進入市場 →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_ESCROW_LISTINGS.map((listing) => (
          <article
            key={listing.id}
            className="rounded-[18px] overflow-hidden border border-[rgba(237,232,224,0.08)] bg-bg-card shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
          >
            <Link href={`/marketplace?escrow=${encodeURIComponent(listing.id)}`} className="block">
              <div className="relative w-full aspect-[4/3] bg-bg-page">
                <Image
                  src={listing.image}
                  alt={listing.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] text-text-primary bg-bg-page/70 backdrop-blur border border-[rgba(237,232,224,0.12)]">
                    🛡️ 鑑定託管
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="inline-flex px-2 py-0.5 rounded-full font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.12)] border border-[rgba(212,165,116,0.22)]">
                    {listing.rarity}
                  </span>
                </div>
              </div>

              <div className="px-4 py-4">
                <p className="font-sans text-[13px] font-semibold text-text-primary truncate">
                  {listing.name}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-mono text-[15px] font-semibold text-success">
                    ¥{listing.price.toLocaleString("ja-JP")}
                  </p>
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-text-secondary truncate max-w-[110px]">
                      {listing.merchantName}
                    </p>
                    <p className="font-mono text-[11px] text-brand">{listing.merchantBadge}</p>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}


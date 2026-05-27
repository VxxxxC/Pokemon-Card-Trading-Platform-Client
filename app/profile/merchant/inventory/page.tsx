import type { Metadata } from "next";
import type { ListingStatus } from "@/app/lib/types/rbac";

export const metadata: Metadata = {
  title: "商品管理 — PokéTrade JP",
  description: "管理庫存卡牌，建立及編輯商品上架",
};

interface Listing {
  id: string;
  cardName: string;
  cardNo: string;
  set: string;
  grade: string;
  grader: "PSA" | "BGS" | "CGC" | "RAW";
  askPrice: number;
  photos: number;
  views: number;
  status: ListingStatus;
  createdAt: string;
}

// TODO: [database] Replace with Supabase query — fetch merchant's listings from `listings` table WHERE seller_id = current user, ordered by created_at DESC
const listings: Listing[] = [
  { id: "LST-001", cardName: "Charizard ex SAR",   cardNo: "sv2a-182", set: "151",            grade: "PSA 10", grader: "PSA", askPrice: 49_800, photos: 6, views: 324, status: "active",  createdAt: "2025/5/15" },
  { id: "LST-002", cardName: "Umbreon ex SAR",     cardNo: "sv6a-109", set: "Night Wanderer",  grade: "BGS 9",  grader: "BGS", askPrice: 36_500, photos: 5, views: 218, status: "active",  createdAt: "2025/5/14" },
  { id: "LST-003", cardName: "Gardevoir ex SAR",   cardNo: "sv4a-237", set: "Shiny Treasure",  grade: "PSA 10", grader: "PSA", askPrice: 38_000, photos: 6, views: 176, status: "active",  createdAt: "2025/5/13" },
  { id: "LST-004", cardName: "Mew ex SAR",         cardNo: "sv2a-205", set: "151",             grade: "PSA 10", grader: "PSA", askPrice: 44_500, photos: 4, views: 89,  status: "sold",    createdAt: "2025/5/10" },
  { id: "LST-005", cardName: "Espeon ex SAR",      cardNo: "s6a-209",  set: "Eevee Heroes",    grade: "BGS 9",  grader: "BGS", askPrice: 29_800, photos: 3, views: 0,   status: "draft",   createdAt: "2025/5/19" },
  { id: "LST-006", cardName: "Jolteon ex SAR",     cardNo: "s6a-206",  set: "Eevee Heroes",    grade: "PSA 9",  grader: "PSA", askPrice: 27_000, photos: 6, views: 134, status: "active",  createdAt: "2025/5/12" },
];

const STATUS_LABEL: Record<ListingStatus, { label: string; className: string }> = {
  active:  { label: "上架中",  className: "text-success bg-[rgba(16,185,129,0.12)]" },
  sold:    { label: "已售出",  className: "text-text-secondary bg-bg-elevated" },
  draft:   { label: "草稿",    className: "text-warning bg-[rgba(239,68,68,0.10)]" },
  pending: { label: "審核中",  className: "text-brand bg-[rgba(212,165,116,0.12)]" },
};

export default function MerchantInventoryPage() {
  const activeCount = listings.filter((l) => l.status === "active").length;
  const draftCount  = listings.filter((l) => l.status === "draft").length;

  return (
    <>
      {/* ── Summary ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "上架中", value: `${activeCount} 件` },
          { label: "草稿",   value: `${draftCount} 件`  },
          { label: "已售出", value: `${listings.filter((l) => l.status === "sold").length} 件` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-3">
            <p className="font-mono text-[11px] text-text-secondary mb-1">{label}</p>
            <p className="font-mono font-bold text-[18px] text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* ── New Listing Form ───────────────────────────────────────────── */}
      <section aria-labelledby="new-listing-heading" className="bg-bg-card rounded-2xl border border-[rgba(212,165,116,0.20)] p-5 mb-6">
        <h2 id="new-listing-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          新增商品上架
        </h2>
        <form className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="card-search" className="font-mono text-[12px] text-text-secondary block mb-1.5">
                卡牌編號 / 名稱搜尋 <span className="text-warning">*</span>
              </label>
              <div className="flex items-center h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden">
                <input
                  id="card-search"
                  type="text"
                  placeholder="sv2a-182 或 Charizard ex SAR"
                  className="flex-1 h-full bg-transparent px-4 font-sans text-[14px] text-text-primary placeholder-text-disabled focus:outline-none"
                />
                <button type="button" className="px-3 h-full font-mono text-[11px] text-brand hover:bg-[rgba(212,165,116,0.08)] transition-colors border-l border-[rgba(237,232,224,0.08)]">
                  搜尋
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="ask-price" className="font-mono text-[12px] text-text-secondary block mb-1.5">
                售價 (JPY) <span className="text-warning">*</span>
              </label>
              <div className="flex items-center h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden">
                <span className="px-3 font-mono text-[13px] text-text-disabled border-r border-[rgba(237,232,224,0.08)]">¥</span>
                <input
                  id="ask-price"
                  type="number"
                  placeholder="0"
                  className="flex-1 h-full bg-transparent px-3 font-mono text-[14px] text-text-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="card-grade" className="font-mono text-[12px] text-text-secondary block mb-1.5">
                鑑定等級
              </label>
              <select
                id="card-grade"
                className="w-full h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[13px] text-text-primary focus:outline-none appearance-none"
              >
                <option>PSA 10</option>
                <option>PSA 9</option>
                <option>BGS 9.5</option>
                <option>BGS 9</option>
                <option>CGC 10</option>
                <option>CGC 9</option>
                <option>RAW NM</option>
                <option>RAW EX</option>
              </select>
            </div>
            <div>
              <label htmlFor="condition-notes" className="font-mono text-[12px] text-text-secondary block mb-1.5">
                品相備註
              </label>
              <input
                id="condition-notes"
                type="text"
                placeholder="例：角落完美，居中良好"
                className="w-full h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[14px] text-text-primary placeholder-text-disabled focus:outline-none"
              />
            </div>
          </div>

          {/* Photo Upload — 4-6 required */}
          {/* TODO: [server] Photo upload divs are decorative — no `<input type="file">` and no Supabase Storage upload handler; implement with supabase.storage.from('listing-photos').upload(`${listingId}/${i}`, file) */}
          <div>
            <label className="font-mono text-[12px] text-text-secondary block mb-1.5">
              實物照片 (必須 4–6 張) <span className="text-warning">*</span>
            </label>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    i < 2
                      ? "border-brand/40 bg-[rgba(212,165,116,0.06)]"
                      : "border-[rgba(237,232,224,0.12)] bg-bg-elevated hover:border-brand/30"
                  }`}
                >
                  {i < 2 ? (
                    <span className="font-mono text-[10px] text-brand">✓ 已上傳</span>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#50453b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span className="font-mono text-[9px] text-text-disabled mt-1">{i < 4 ? "必填" : "選填"}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] text-text-disabled mt-1.5">
              請拍攝正面、背面、卡角、刮痕細節，確保品相透明。最大 10MB / 張。
            </p>
          </div>

          <div className="flex gap-3">
            {/* TODO: [server] "儲存草稿" has no handler — must call server action to INSERT into `listings` with status='draft' */}
            {/* TODO: [server] "立即上架" form submit has no handler — must call server action to INSERT into `listings` with status='active', then update merchant inventory count */}
            <button type="button" className="flex-1 h-11 font-sans text-[14px] font-medium text-text-secondary border border-[rgba(237,232,224,0.12)] rounded-xl hover:bg-bg-elevated active:scale-[0.98] transition-all">
              儲存草稿
            </button>
            <button type="submit" className="flex-1 h-11 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-xl hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform">
              立即上架
            </button>
          </div>
        </form>
      </section>

      {/* ── Listings Table ─────────────────────────────────────────────── */}
      <section aria-labelledby="listings-heading">
        <h2 id="listings-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          所有商品 ({listings.length})
        </h2>
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
          {listings.map((listing, i) => {
            const { label, className } = STATUS_LABEL[listing.status];
            return (
              <div
                key={listing.id}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}
              >
                <div className="w-8 h-11 rounded-md bg-bg-elevated border border-[rgba(237,232,224,0.08)] shrink-0 flex items-center justify-center">
                  <span className="font-mono text-[9px] text-text-disabled">{listing.set.slice(0, 3).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-sans text-[13px] font-medium text-text-primary truncate">{listing.cardName}</p>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${className}`}>{label}</span>
                  </div>
                  <p className="font-mono text-[11px] text-text-secondary">{listing.cardNo} · {listing.grade} · {listing.photos} 張照片 · {listing.views} 次瀏覽</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-[14px] text-text-primary">¥{listing.askPrice.toLocaleString("zh-TW")}</p>
                  <p className="font-mono text-[10px] text-text-disabled">{listing.createdAt}</p>
                </div>
                <button type="button" className="ml-1 font-mono text-[11px] text-text-secondary hover:text-text-primary border border-[rgba(237,232,224,0.08)] px-2 py-1 rounded-lg transition-colors shrink-0">
                  編輯
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

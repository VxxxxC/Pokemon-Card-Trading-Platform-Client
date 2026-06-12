import type { Metadata } from "next";
import { NewListingForm } from "@/app/components/merchant/NewListingForm";
import {
  InventoryAccordion,
  type MerchantListing,
} from "@/app/components/merchant/InventoryAccordion";

export const metadata: Metadata = {
  title: "商品管理 — PokéTrade JP",
  description: "管理庫存卡牌，建立及編輯商品上架",
};

// TODO: [database] Replace with Supabase query — fetch merchant's listings from `listings` table WHERE seller_id = current user, ordered by created_at DESC
// TODO: [database] conditionDesc / edgeWear / thumbnailSeeds / viewTrail are mock expansion-layer data — hydrate from `listing_details` + `listing_view_events` aggregation
const listings: MerchantListing[] = [
  {
    id: "LST-001", cardName: "Charizard ex SAR", cardNo: "sv2a-182", set: "151",
    grade: "PSA 10", grader: "PSA", askPrice: 49_800, photos: 6, views: 324,
    status: "active", createdAt: "2025/5/15",
    conditionDesc: "正面鏡面無刮痕，居中 55/45，黑芯完整無白點。",
    edgeWear: "四角銳利無磨損，PSA 封殼完美無裂紋。",
    thumbnailSeeds: ["lst001-front", "lst001-back", "lst001-corner", "lst001-edge"],
    viewTrail: [
      { period: "本週", views: 142 },
      { period: "上週", views: 96 },
      { period: "兩週前", views: 86 },
    ],
  },
  {
    id: "LST-002", cardName: "Umbreon ex SAR", cardNo: "sv6a-109", set: "Night Wanderer",
    grade: "BGS 9", grader: "BGS", askPrice: 36_500, photos: 5, views: 218,
    status: "active", createdAt: "2025/5/14",
    conditionDesc: "亞光面細微壓痕一處（左下），整體呈現極佳。",
    edgeWear: "右上角輕微白邊 0.3mm，其餘三角完好。",
    thumbnailSeeds: ["lst002-front", "lst002-back", "lst002-corner"],
    viewTrail: [
      { period: "本週", views: 88 },
      { period: "上週", views: 74 },
      { period: "兩週前", views: 56 },
    ],
  },
  {
    id: "LST-003", cardName: "Gardevoir ex SAR", cardNo: "sv4a-237", set: "Shiny Treasure",
    grade: "PSA 10", grader: "PSA", askPrice: 38_000, photos: 6, views: 176,
    status: "active", createdAt: "2025/5/13",
    conditionDesc: "閃膜均勻無霧化，卡面壓紋立體飽滿。",
    edgeWear: "邊緣切割平整，無任何白邊或毛邊。",
    thumbnailSeeds: ["lst003-front", "lst003-back", "lst003-corner", "lst003-edge"],
    viewTrail: [
      { period: "本週", views: 64 },
      { period: "上週", views: 58 },
      { period: "兩週前", views: 54 },
    ],
  },
  {
    id: "LST-004", cardName: "Mew ex SAR", cardNo: "sv2a-205", set: "151",
    grade: "PSA 10", grader: "PSA", askPrice: 44_500, photos: 4, views: 89,
    status: "sold", createdAt: "2025/5/10",
    conditionDesc: "全新開包直送鑑定，鏡面零瑕疵。",
    edgeWear: "四角完美，已售出封存於託管倉。",
    thumbnailSeeds: ["lst004-front", "lst004-back"],
    viewTrail: [
      { period: "本週", views: 12 },
      { period: "上週", views: 35 },
      { period: "兩週前", views: 42 },
    ],
  },
  {
    id: "LST-005", cardName: "Espeon ex SAR", cardNo: "s6a-209", set: "Eevee Heroes",
    grade: "BGS 9", grader: "BGS", askPrice: 29_800, photos: 3, views: 0,
    status: "draft", createdAt: "2025/5/19",
    conditionDesc: "草稿暫存中 — 待補充正背面高解析實拍。",
    edgeWear: "左下角極輕微壓白，建議補拍微距特寫。",
    thumbnailSeeds: ["lst005-front"],
    viewTrail: [
      { period: "本週", views: 0 },
      { period: "上週", views: 0 },
      { period: "兩週前", views: 0 },
    ],
  },
  {
    id: "LST-006", cardName: "Jolteon ex SAR", cardNo: "s6a-206", set: "Eevee Heroes",
    grade: "PSA 9", grader: "PSA", askPrice: 27_000, photos: 6, views: 134,
    status: "active", createdAt: "2025/5/12",
    conditionDesc: "卡面有一道極淺印刷線（不影響評級），閃度滿分。",
    edgeWear: "背面下緣輕微磨白，正面四角銳利。",
    thumbnailSeeds: ["lst006-front", "lst006-back", "lst006-corner"],
    viewTrail: [
      { period: "本週", views: 48 },
      { period: "上週", views: 52 },
      { period: "兩週前", views: 34 },
    ],
  },
];

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

      {/* ── New Listing Form（React 19 原生非受控 Form Actions） ────────── */}
      <NewListingForm />

      {/* ── Listings Accordion（SKU 深度檢視容器系統） ───────────────────── */}
      <section aria-labelledby="listings-heading">
        <h2 id="listings-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          所有商品 ({listings.length})
        </h2>
        <InventoryAccordion listings={listings} />
      </section>
    </>
  );
}

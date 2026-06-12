"use client";

import { useState } from "react";
import { NewListingForm } from "@/app/components/merchant/NewListingForm";
import {
  InventoryAccordion,
  type SKUGroup,
} from "@/app/components/merchant/InventoryAccordion";
import { Accordion } from "@/app/components/ui/Accordion";

// TODO [MOCK DATA]: Replace with Supabase query —
// SELECT skus.*, json_agg(listings.*) AS items
// FROM skus LEFT JOIN listings ON listings.sku_id = skus.id
// WHERE skus.merchant_id = current_user_id
// GROUP BY skus.id ORDER BY skus.created_at DESC
const skuGroups: SKUGroup[] = [
  {
    id: "SKU-sv2a-182",
    cardName: "Charizard ex SAR",
    cardNo: "sv2a-182",
    set: "151",
    thumbnailSeed: "sku-sv2a-182-charizard",
    items: [
      {
        id: "LST-001-A",
        grade: "PSA 10",
        grader: "PSA",
        askPrice: 49_800,
        status: "active",
        createdAt: "2025/5/15",
        conditionDesc: "正面鏡面無刮痕，居中 55/45，黑芯完整無白點。",
        edgeWear: "四角銳利無磨損，PSA 封殼完美無裂紋。",
        photos: 6,
        views: 324,
      },
      {
        id: "LST-001-B",
        grade: "PSA 9",
        grader: "PSA",
        askPrice: 28_500,
        status: "active",
        createdAt: "2025/5/16",
        conditionDesc: "左下角極輕微壓白 0.2mm，整體觀感仍佳。",
        edgeWear: "背面邊緣一處微小磨痕，PSA 封殼完整。",
        photos: 5,
        views: 145,
      },
    ],
  },
  {
    id: "SKU-sv6a-109",
    cardName: "Umbreon ex SAR",
    cardNo: "sv6a-109",
    set: "Night Wanderer",
    thumbnailSeed: "sku-sv6a-109-umbreon",
    items: [
      {
        id: "LST-002-A",
        grade: "BGS 9",
        grader: "BGS",
        askPrice: 36_500,
        status: "active",
        createdAt: "2025/5/14",
        conditionDesc: "亞光面細微壓痕一處（左下），整體呈現極佳。",
        edgeWear: "右上角輕微白邊 0.3mm，其餘三角完好。",
        photos: 5,
        views: 218,
      },
    ],
  },
  {
    id: "SKU-sv4a-237",
    cardName: "Gardevoir ex SAR",
    cardNo: "sv4a-237",
    set: "Shiny Treasure",
    thumbnailSeed: "sku-sv4a-237-gardevoir",
    items: [
      {
        id: "LST-003-A",
        grade: "PSA 10",
        grader: "PSA",
        askPrice: 38_000,
        status: "active",
        createdAt: "2025/5/13",
        conditionDesc: "閃膜均勻無霧化，卡面壓紋立體飽滿。",
        edgeWear: "邊緣切割平整，無任何白邊或毛邊。",
        photos: 6,
        views: 176,
      },
    ],
  },
  {
    id: "SKU-sv2a-205",
    cardName: "Mew ex SAR",
    cardNo: "sv2a-205",
    set: "151",
    thumbnailSeed: "sku-sv2a-205-mew",
    items: [
      {
        id: "LST-004-A",
        grade: "PSA 10",
        grader: "PSA",
        askPrice: 44_500,
        status: "sold",
        createdAt: "2025/5/10",
        conditionDesc: "全新開包直送鑑定，鏡面零瑕疵。",
        edgeWear: "四角完美，已售出封存於託管倉。",
        photos: 4,
        views: 89,
      },
    ],
  },
  {
    id: "SKU-s6a-209",
    cardName: "Espeon ex SAR",
    cardNo: "s6a-209",
    set: "Eevee Heroes",
    thumbnailSeed: "sku-s6a-209-espeon",
    items: [
      {
        id: "LST-005-A",
        grade: "BGS 9",
        grader: "BGS",
        askPrice: 29_800,
        status: "draft",
        createdAt: "2025/5/19",
        conditionDesc: "草稿暫存中 — 待補充正背面高解析實拍。",
        edgeWear: "左下角極輕微壓白，建議補拍微距特寫。",
        photos: 3,
        views: 0,
      },
    ],
  },
  {
    id: "SKU-s6a-206",
    cardName: "Jolteon ex SAR",
    cardNo: "s6a-206",
    set: "Eevee Heroes",
    thumbnailSeed: "sku-s6a-206-jolteon",
    items: [
      {
        id: "LST-006-A",
        grade: "PSA 9",
        grader: "PSA",
        askPrice: 27_000,
        status: "active",
        createdAt: "2025/5/12",
        conditionDesc: "卡面有一道極淺印刷線（不影響評級），閃度滿分。",
        edgeWear: "背面下緣輕微磨白，正面四角銳利。",
        photos: 6,
        views: 134,
      },
    ],
  },
];

// ─── Derived summary counts ────────────────────────────────────────────────────

function countByStatus(
  groups: SKUGroup[],
  status: SKUGroup["items"][number]["status"],
) {
  return groups.reduce(
    (total, sku) => total + sku.items.filter((item) => item.status === status).length,
    0,
  );
}

// ─── Page Component ────────────────────────────────────────────────────────────

export default function MerchantInventoryPage() {
  const activeCount = countByStatus(skuGroups, "active");
  const draftCount  = countByStatus(skuGroups, "draft");
  const soldCount   = countByStatus(skuGroups, "sold");
  const totalItems  = skuGroups.reduce((t, sku) => t + sku.items.length, 0);

  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Summary 數據統計卡 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "上架中", value: `${activeCount} 件` },
          { label: "草稿",   value: `${draftCount} 件`  },
          { label: "已售出", value: `${soldCount} 件`   },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-3 shadow-sm"
          >
            <p className="font-mono text-[11px] text-text-secondary mb-1">{label}</p>
            <p className="font-mono font-bold text-[18px] text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* ── 新增商品上架 Accordion ─────────────────────────────────────── */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-5 py-2.5 shadow-md">
        <Accordion
          title={
            <div className="flex items-center gap-2 font-sans text-[14.5px] md:text-[15.5px] font-black text-brand normal-case tracking-tight">
              <span>新增商品上架登記</span>
            </div>
          }
          isOpen={isFormOpen}
          onToggle={() => setIsFormOpen((prev) => !prev)}
          className="border-none py-2"
        >
          <div className="pt-3 pb-3 border-t border-white/5">
            <NewListingForm />
          </div>
        </Accordion>
      </div>

      {/* ── SKU Grouped Inventory Accordion ───────────────────────────── */}
      <section aria-labelledby="listings-heading" className="pt-1">
        <h2
          id="listings-heading"
          className="font-sans font-semibold text-[16px] text-text-primary mb-4"
        >
          所有商品 ({skuGroups.length} 個 SKU · 共 {totalItems} 張實物)
        </h2>
        <InventoryAccordion skuGroups={skuGroups} />
      </section>
    </div>
  );
}

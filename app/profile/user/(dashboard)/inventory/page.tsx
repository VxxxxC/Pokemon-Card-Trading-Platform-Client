"use client";

import { useState, useMemo, useEffect } from "react";
import { NewListingForm } from "@/app/components/merchant/NewListingForm";
import {
  InventoryAccordion,
  type SKUGroup,
} from "@/app/components/merchant/InventoryAccordion";
import { Pagination } from "@/app/components/ui/Pagination";

const skuGroups: SKUGroup[] = [
  {
    id: "SKU-sv2a-182",
    cardName: "Charizard ex SAR",
    cardNo: "sv2a-182",
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
        offersCount: 0,
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
        offersCount: 3,
      },
    ],
  },
  {
    id: "SKU-sv6a-109",
    cardName: "Umbreon ex SAR",
    cardNo: "sv6a-109",
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
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-sv4a-237",
    cardName: "Gardevoir ex SAR",
    cardNo: "sv4a-237",
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
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-sv2a-205",
    cardName: "Mew ex SAR",
    cardNo: "sv2a-205",
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
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-s6a-209",
    cardName: "Espeon ex SAR",
    cardNo: "s6a-209",
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
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-s6a-206",
    cardName: "Jolteon ex SAR",
    cardNo: "s6a-206",
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
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-sv2a-173",
    cardName: "Pikachu AR",
    cardNo: "sv2a-173",
    thumbnailSeed: "sku-sv2a-173-pikachu",
    items: [
      {
        id: "LST-007-A",
        grade: "PSA 10",
        grader: "PSA",
        askPrice: 12_800,
        status: "active",
        createdAt: "2025/5/18",
        conditionDesc: "頂級評分品相，無印刷線，居中度極佳。",
        edgeWear: "完美邊角，封殼無瑕疵。",
        photos: 6,
        views: 245,
        offersCount: 0,
      },
      {
        id: "LST-007-B",
        grade: "PSA 10",
        grader: "PSA",
        askPrice: 12_500,
        status: "active",
        createdAt: "2025/5/18",
        conditionDesc: "極微小原廠印刷痕，整體觀感無瑕。",
        edgeWear: "四角完美，背面無磨損。",
        photos: 5,
        views: 180,
        offersCount: 0,
      },
      {
        id: "LST-007-C",
        grade: "PSA 9",
        grader: "PSA",
        askPrice: 7_200,
        status: "active",
        createdAt: "2025/5/19",
        conditionDesc: "背面右上角輕微白點，其餘狀態良好。",
        edgeWear: "有一處極微白邊，正面無瑕。",
        photos: 4,
        views: 92,
        offersCount: 1,
      },
      {
        id: "LST-007-D",
        grade: "BGS 9.5",
        grader: "BGS",
        askPrice: 11_000,
        status: "active",
        createdAt: "2025/5/20",
        conditionDesc: "金標保證，品品相極佳，具有良好收藏價值。",
        edgeWear: "四角 9.5，卡面 10，邊緣 9.5。",
        photos: 6,
        views: 110,
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-s12a-221",
    cardName: "Mewtwo VSTAR SAR",
    cardNo: "s12a-221",
    thumbnailSeed: "sku-s12a-221-mewtwo",
    items: [
      {
        id: "LST-008-A",
        grade: "PSA 10",
        grader: "PSA",
        askPrice: 14_800,
        status: "active",
        createdAt: "2025/5/14",
        conditionDesc: "閃膜均勻完整，紋理立體，完美無瑕疵。",
        edgeWear: "切割完美，邊緣光滑無白邊。",
        photos: 5,
        views: 320,
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-sv2a-206",
    cardName: "Erika's Invitation SAR",
    cardNo: "sv2a-206",
    thumbnailSeed: "sku-sv2a-206-erika",
    items: [
      {
        id: "LST-009-A",
        grade: "PSA 10",
        grader: "PSA",
        askPrice: 38_500,
        status: "active",
        createdAt: "2025/5/13",
        conditionDesc: "高人氣女角，卡面無刮痕，光澤度極佳。",
        edgeWear: "四角銳利無瑕，封殼無磨損。",
        photos: 6,
        views: 412,
        offersCount: 0,
      },
      {
        id: "LST-009-B",
        grade: "RAW NM",
        grader: "RAW",
        askPrice: 18_000,
        status: "draft",
        createdAt: "2025/5/15",
        conditionDesc: "草稿暫存中 — 肉眼觀察無明顯白邊，待補實物細拍。",
        edgeWear: "四角完整，未送評但狀態優良。",
        photos: 3,
        views: 0,
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-s11-111",
    cardName: "Giratina V SA",
    cardNo: "s11-111",
    thumbnailSeed: "sku-s11-111-giratina",
    items: [
      {
        id: "LST-010-A",
        grade: "PSA 10",
        grader: "PSA",
        askPrice: 85_000,
        status: "active",
        createdAt: "2025/5/10",
        conditionDesc: "失落深淵超級大獎，卡面細節完美，無印刷線。",
        edgeWear: "邊角無白邊，PSA 頂級認證。",
        photos: 6,
        views: 612,
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-sv4a-350",
    cardName: "Iono SAR",
    cardNo: "sv4a-350",
    thumbnailSeed: "sku-sv4a-350-iono",
    items: [
      {
        id: "LST-011-A",
        grade: "BGS 9.5",
        grader: "BGS",
        askPrice: 32_000,
        status: "active",
        createdAt: "2025/5/11",
        conditionDesc: "奇樹人氣卡牌，閃膜細緻無白點，置中度優異。",
        edgeWear: "四角均呈 9.5 以上的高水準評分。",
        photos: 5,
        views: 289,
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-s12-110",
    cardName: "Lugia V SA",
    cardNo: "s12-110",
    thumbnailSeed: "sku-s12-110-lugia",
    items: [
      {
        id: "LST-012-A",
        grade: "PSA 10",
        grader: "PSA",
        askPrice: 62_000,
        status: "active",
        createdAt: "2025/5/09",
        conditionDesc: "神秘群島守護神，精細度極高，零銀幕劃痕。",
        edgeWear: "切角端正銳利，背面極度乾淨。",
        photos: 6,
        views: 450,
        offersCount: 0,
      },
      {
        id: "LST-012-B",
        grade: "PSA 9",
        grader: "PSA",
        askPrice: 34_000,
        status: "active",
        createdAt: "2025/5/10",
        conditionDesc: "背面下邊緣有一極微小白點，不影響正面觀感。",
        edgeWear: "有一處 0.1mm 輕微壓痕，其蹤跡完好。",
        photos: 4,
        views: 188,
        offersCount: 0,
      },
    ],
  },
  {
    id: "SKU-sm4-119",
    cardName: "Lillie SR",
    cardNo: "sm4+-119",
    thumbnailSeed: "sku-sm4-119-lillie",
    items: [
      {
        id: "LST-013-A",
        grade: "PSA 10",
        grader: "PSA",
        askPrice: 1_280_000,
        status: "active",
        createdAt: "2025/5/01",
        conditionDesc: "殿堂級珍藏莉莉艾 SR，色澤鮮豔無褪色，極高收藏級品品相。",
        edgeWear: "極致完美，PSA 10 頂峰鑑定，封盒保護妥善。",
        photos: 6,
        views: 1450,
        offersCount: 0,
      },
    ],
  },
];

function countByStatus(
  groups: SKUGroup[],
  status: SKUGroup["items"][number]["status"],
) {
  return groups.reduce(
    (total, sku) => total + sku.items.filter((item) => item.status === status).length,
    0,
  );
}

export default function UserInventoryPage() {
  const totalItems  = skuGroups.reduce((t, sku) => t + sku.items.length, 0);
  const activeCount = countByStatus(skuGroups, "active");
  const soldCount   = countByStatus(skuGroups, "sold");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSkuPage, setCurrentSkuPage] = useState(1);
  const skusPerPage = 6;

  useEffect(() => {
    queueMicrotask(() => setCurrentSkuPage(1));
  }, [searchQuery]);

  const filteredSkuGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return skuGroups;
    return skuGroups.filter(
      (sku) =>
        sku.cardName.toLowerCase().includes(query) ||
        sku.cardNo.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const paginatedSkuGroups = useMemo(() => {
    return filteredSkuGroups.slice(
      (currentSkuPage - 1) * skusPerPage,
      currentSkuPage * skusPerPage
    );
  }, [filteredSkuGroups, currentSkuPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Summary 數據統計卡 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "現貨",   value: `${totalItems} 件`  },
          { label: "上架中", value: `${activeCount} 件` },
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

      {/* ── 🟢 智慧卡牌商品搜尋欄 ────────────────────────────────── */}
      <div className="relative bg-bg-card border border-[rgba(237,232,224,0.08)] p-4 rounded-2xl shadow-sm flex flex-col gap-2">
        <label htmlFor="user-sku-search" className="font-mono text-[11px] text-text-secondary uppercase tracking-wider">
          🔍 智慧卡牌商品檢索控制台 (SUPPORT FUZZY QUERY)
        </label>
        <div className="flex items-center bg-[#17130f] border border-white/5 rounded-xl h-11 text-text-primary overflow-hidden w-full transition-all focus-within:border-brand/30">
          <input
            id="user-sku-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋卡牌名稱、卡號 (如 sv2a-182)..."
            className="flex-1 h-full bg-transparent px-4 font-sans text-[13.5px] text-text-primary placeholder-text-disabled focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="px-3 h-full font-sans text-[12px] text-text-disabled hover:text-text-primary transition-colors cursor-pointer"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* ── 🟢 HIGH-PERFORMANCE GRID ACCORDION SHIELD FOR CREATION CABINET ── */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-5 py-3.5 shadow-md">
        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          aria-expanded={isFormOpen}
          aria-controls="new-listing-form-panel"
          className="w-full flex items-center justify-between font-sans text-[14.5px] md:text-[15.5px] font-black text-brand normal-case tracking-tight group focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>新增商品</span>
          </div>

          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a89888"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`shrink-0 transition-transform duration-300 ${isFormOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div
          id="new-listing-form-panel"
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            isFormOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-4 mt-3 border-t border-white/5">
              <NewListingForm />
            </div>
          </div>
        </div>
      </div>

      {/* ── SKU Grouped Inventory Accordion ───────────────────────────── */}
      <section aria-labelledby="listings-heading" className="pt-1">
        <h2
          id="listings-heading"
          className="font-sans font-semibold text-[16px] text-text-primary mb-4 space-x-2"
        >
          <span>所有商品</span>
          <span className="font-mono text-sm px-1.5 py-0.5 rounded text-success bg-[rgba(16,185,129,0.12)]">{filteredSkuGroups.length} 款 卡牌</span> 
          <span className="font-mono text-sm px-1.5 py-0.5 rounded bg-[rgba(212,165,116,0.10)] text-brand border border-brand/20 shrink-0">{totalItems} 張現貨</span>
        </h2>
        <InventoryAccordion skuGroups={paginatedSkuGroups} analytics={false}/>

        {/* ── 🟢 SKU Group Pagination ── */}
        <div className="pt-4">
          <Pagination
            currentPage={currentSkuPage}
            totalPages={Math.ceil(filteredSkuGroups.length / skusPerPage)}
            onPageChange={(page) => setCurrentSkuPage(page)}
            itemLabel="款卡牌商品"
            totalItems={filteredSkuGroups.length}
            itemsPerPage={skusPerPage}
            enableScroll={true}
          />
        </div>
      </section>
    </div>
  );
}

"use client";

import { use, useMemo, useSyncExternalStore, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";
import {
  getPublicMemberById,
  getStorefrontListingsByMember,
} from "@/app/lib/mock-data/members";
// 🟢 核心引入：引入大盤唯一事實來源 (SSOT) 獲取官方標準資產規格
import {
  INITIAL_LISTINGS,
  type UnifiedProductSpec,
} from "@/app/lib/mock-data/cards";
import { IoChevronBack } from "react-icons/io5";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; productId: string }>;
}

// 🟢 TS 高級語意提純：活用 Pick 抽取真理源屬性矩陣，拒絕巨石重覆程式碼，防範型態漂移債
type CardSpecificationMatrix = Pick<
  UnifiedProductSpec,
  | "set"
  | "type"
  | "stage"
  | "weakness"
  | "retreatCost"
  | "moveDamage"
  | "artist"
>;

export default function MerchantProductDetailPage({ params }: PageProps) {
  const { id, productId } = use(params);
  const member = getPublicMemberById(id);
  const router = useRouter();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const storefrontListing = useMemo(() => {
    if (!member) return null;
    return getStorefrontListingsByMember(member).find(
      (listing) => listing.id === productId,
    );
  }, [member, productId]);

  const item = useMemo(() => {
    if (!member) return null;
    return (
      member.activeListings.find((listing) => listing.id === productId) ?? null
    );
  }, [member, productId]);

  // 🟢 核心優化：建立與大盤真理源的對齊防線 (透過卡號/商品編號自動補齊卡牌屬性資料)
  const canonicalCardSpec = useMemo<CardSpecificationMatrix | null>(() => {
    if (!item) return null;
    // 透過 cardNo (例如 sv2a-182) 去全網大盤資料庫掃描對應的標準資產卡片
    const found = INITIAL_LISTINGS.find((c) => c.id === item.cardNo);
    if (!found) return null;

    return {
      set: found.set,
      type: found.type,
      stage: found.stage,
      weakness: found.weakness,
      retreatCost: found.retreatCost,
      moveDamage: found.moveDamage,
      artist: found.artist,
    };
  }, [item]);

  // 🟢 核心優化：創造賣家至少 4 張實物多角度卡牌相片 (Quad-Angle Image Suite)
  const merchantRealPhotos = useMemo<string[]>(() => {
    if (!item) return [];
    const found = INITIAL_LISTINGS.find((c) => c.id === item.cardNo);
    if (found && found.images.length >= 2) {
      return [
        ...found.images,
        "https://picsum.photos/seed/macro-angle/600/420",
        "https://picsum.photos/seed/surface-check/600/420",
      ].slice(0, 4);
    }
    return [
      item.image,
      "https://picsum.photos/seed/corner-detail/600/420",
      "https://picsum.photos/seed/holo-reflect/600/420",
      "https://picsum.photos/seed/back-surface/600/420",
    ];
  }, [item]);

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!member || !item || !storefrontListing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#17130f] py-20">
        <h1 className="text-xl font-sans font-bold text-text-disabled">
          未找到該私域現貨標的
        </h1>
        <Link
          href={member ? `/marketplace/${member.id}` : "/marketplace"}
          className="text-brand text-sm mt-2 hover:underline"
        >
          {member ? "返回商戶櫥窗" : "返回全網大盤"}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-[#17130f]">
      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 lg:px-8 py-6 pb-32 animate-fadeIn">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-8 px-2.5 rounded-lg bg-[#1A1612] font-sans text-[12px] font-medium text-brand focus:outline-none"
        >
          <IoChevronBack />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 items-start">
          {/* 左側：四大真實卡牌相片展示主網格 (Quad-Angle Photo Suite) */}
          <section className="lg:col-span-5 lg:sticky lg:top-[5.5rem] space-y-3.5 mb-6 lg:mb-0">
            <div className="relative w-full aspect-[5/3.8] bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden shadow-xl">
              <Image
                src={merchantRealPhotos[activeImageIndex]}
                alt={`${item.name} 賣家實物特寫角度 ${activeImageIndex + 1}`}
                fill
                priority
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="inline-flex px-2 py-1 rounded bg-[#17130f]/85 backdrop-blur-sm border border-[rgba(237,232,224,0.15)] font-mono text-[9px] font-black text-brand uppercase tracking-widest">
                  📸 賣家實物 3D 多維存證圖
                </span>
              </div>
            </div>

            {/* 4張真實卡牌相片切換按鈕排 */}
            <div className="grid grid-cols-4 gap-2">
              {merchantRealPhotos.map((img, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setActiveImageIndex(i)}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative aspect-[5/3.8] bg-[#26211C] rounded-xl overflow-hidden border transition-all cursor-pointer focus:outline-none ${
                    activeImageIndex === i
                      ? "border-brand ring-1 ring-brand/40 shadow-md"
                      : "border-[rgba(237,232,224,0.08)] hover:border-brand/40"
                  }`}
                  aria-label={`查看實物特寫角度 ${i + 1}`}
                >
                  <Image
                    src={img}
                    alt={`角度 ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                    unoptimized
                  />
                  <div className="absolute bottom-1 right-1 font-mono text-[8px] bg-black/60 px-1 rounded text-[#eae1da] scale-90">
                    角 {i + 1}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 右側：商品核心數據與規格屬性資料矩陣 */}
          <section className="lg:col-span-7 space-y-5">
            <div>
              <span className="inline-flex font-mono text-[9px] bg-brand/10 text-brand px-2 py-0.5 rounded font-black border border-brand/20 uppercase tracking-widest">
                store exclusive item
              </span>
              <h1 className="font-sans font-black text-[24px] lg:text-[28px] text-[#eae1da] mt-1.5 leading-tight tracking-tight">
                {item.name}
              </h1>
              <p className="font-mono text-[12px] text-text-disabled mt-1">
                官方卡號基準:{" "}
                <span className="text-[#eae1da] font-bold">
                  {item.cardNo || "未標註"}
                </span>{" "}
                · 出讓批次: {productId}
              </p>
            </div>

            {/* 價格出讓艙體 */}
            <div className="bg-[#26211C] p-5 rounded-2xl border border-[rgba(212,165,116,0.20)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
              <div>
                <span className="font-mono text-[10px] text-[#d4c4b7] block mb-1 uppercase tracking-wide">
                  店主獨立出讓一口價
                </span>
                <p className="font-mono font-black text-[30px] text-brand leading-none">
                  HK$ {item.price.toLocaleString("en-HK")}
                </p>
                <p
                  className={`font-mono text-[11px] mt-1.5 flex items-center gap-1 ${
                    item.deltaDirection === "up"
                      ? "text-[#22c55e]"
                      : "text-[#ef4444]"
                  }`}
                >
                  <span>{item.deltaDirection === "up" ? "▲" : "▼"}</span>
                  <span>
                    HK$ {item.delta.toLocaleString("en-HK")} vs 全網 24h 參考線
                  </span>
                </p>
              </div>
              <BuyButton
                listing={storefrontListing}
                className="h-11 px-8 text-[13px] font-sans font-black rounded-xl shrink-0 active:scale-[0.97] transition-transform cursor-pointer"
              />
            </div>

            {/* 👑 24K 拋光流金極致改裝：高貴亮金導流按鈕 */}
            <Link
              href={`/marketplace/product/${productId}`}
              className="w-full h-12 flex items-center justify-between px-5 rounded-xl bg-linear-to-r from-[#e5c199] via-[#d4a574] to-[#bfa37a] hover:from-[#f3d2ab] hover:to-[#ceb28a] text-[#17130f] font-sans font-black text-[13.5px] tracking-wide transition-all duration-300 shadow-[0_4px_20px_rgba(212,165,116,0.25)] hover:shadow-[0_6px_25px_rgba(212,165,116,0.4)] active:scale-[0.99] cursor-pointer text-left focus:outline-none shrink-0 group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[15px] group-hover:rotate-12 transition-transform duration-300">
                  📊
                </span>
                <span>進入公開大盤商品市場</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="transform group-hover:translate-x-1 transition-transform duration-300"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>

            {/* 實物狀態展示表 */}
            <div className="bg-[#26211C] rounded-xl border border-[rgba(237,232,224,0.08)] overflow-hidden font-sans text-[13px]">
              <div className="flex justify-between items-center p-3.5 bg-[#2c2722] border-b border-white/5">
                <span className="text-[#d4c4b7]">實物鑑定品品相評級</span>
                <div className="flex items-center gap-1.5">
                  <RarityBadge rarity={item.rarity} />
                  <GradeBadge
                    authority={item.grade.authority}
                    score={item.grade.score}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-[#26211C] border-b border-white/5">
                <span className="text-[#d4c4b7]">店主實物標註</span>
                <span className="font-sans font-extrabold text-[#eae1da] bg-[#1A1612] px-2 py-0.5 rounded border border-white/5 text-[12px]">
                  {item.conditionLabel || "美品 S"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-[#26211C] border-b border-white/5">
                <span className="text-[#d4c4b7]">中介託管狀態</span>
                <span className="text-[#22c55e] font-bold flex items-center gap-1">
                  🔒 平台官方安全中介存證已鎖定
                </span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-[#26211C]">
                <span className="text-[#d4c4b7]">賣家識別商號</span>
                <span className="font-mono text-[#eae1da]">
                  {member.handle} ·{" "}
                  <span className="text-brand font-bold">
                    {(member.completedTrades ?? 0).toLocaleString()}
                  </span>{" "}
                  筆歷史交割
                </span>
              </div>
            </div>

            {/* 🟢 全新高能加裝：官方真理資產屬性規格矩陣表 (Standard Specification Table) */}
            {canonicalCardSpec ? (
              <div className="bg-[#26211C] rounded-xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
                <div className="px-4 py-3 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between">
                  <h3 className="font-sans font-bold text-[13px] text-[#eae1da]">
                    官方標準資產規格數據
                  </h3>
                  <span className="font-mono text-[9px] text-[#8A8680] uppercase tracking-widest">
                    CANONICAL SPEC
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 font-sans text-[13px]">
                  {[
                    { label: "所屬擴充包", val: canonicalCardSpec.set },
                    { label: "資產屬性", val: canonicalCardSpec.type },
                    { label: "進化階段", val: canonicalCardSpec.stage },
                    { label: "天生弱點", val: canonicalCardSpec.weakness },
                    { label: "撤退成本", val: canonicalCardSpec.retreatCost },
                    { label: "官方畫師", val: canonicalCardSpec.artist },
                  ].map((row, idx) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between p-3.5 ${
                        idx % 2 === 0 ? "bg-[#2c2722]" : "bg-[#26211C]"
                      } border-b border-white/[0.04]`}
                    >
                      <span className="text-[#d4c4b7]">{row.label}</span>
                      <span className="font-semibold text-[#eae1da] text-right truncate max-w-[180px]">
                        {row.val}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3.5 bg-[#2c2722] border-b border-white/[0.04] sm:col-span-2">
                    <span className="text-[#d4c4b7]">核心招式能力傷害指標</span>
                    <span className="bold text-[#eae1da] font-mono text-[12px] bg-[#1A1612] px-2 py-1 rounded border border-white/5">
                      {canonicalCardSpec.moveDamage}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback Alert Banner when specification mapping fails */
              <div className="p-4 rounded-xl border border-dashed border-white/5 text-center font-sans text-[12.5px] text-text-disabled bg-[#26211C]/30">
                ⚠️ 無法載入該特定卡牌的官方招式屬性資料表 (SSOT Alignment
                Pending)
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

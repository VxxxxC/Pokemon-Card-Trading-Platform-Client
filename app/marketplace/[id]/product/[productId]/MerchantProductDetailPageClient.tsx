"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";
import type { MarketplaceSellerListingDetailView } from "@/app/lib/marketplace/types";
import { formatElementTypeZh } from "@/lib/catalog/element-types";
import { formatListingGrade } from "@/lib/marketplace/listing-display";
import { IoChevronBack } from "react-icons/io5";

interface MerchantProductDetailPageClientProps {
  detail: MarketplaceSellerListingDetailView | null;
  routeProductId: string;
  bootstrapError?: string;
}

export function MerchantProductDetailPageClient({
  detail,
  routeProductId,
  bootstrapError,
}: MerchantProductDetailPageClientProps) {
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!detail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#17130f] py-20">
        <h1 className="text-xl font-sans font-bold text-text-disabled">
          {bootstrapError ?? "未找到該私域現貨標的"}
        </h1>
        <Link
          href="/marketplace"
          className="text-brand text-sm mt-2 hover:underline"
        >
          返回全網大盤
        </Link>
      </div>
    );
  }

  const { seller, catalog, storefrontListing, photos, batchLabel, price } =
    detail;
  const grade = formatListingGrade(
    detail.gradingCompany,
    detail.gradingScore,
  );
  const cardCode =
    catalog.cardNumber?.trim() ||
    catalog.displayId?.trim() ||
    catalog.productId;
  const publicProductHref = `/marketplace/product/${
    catalog.displayId ?? catalog.productId
  }`;

  const specRows = [
    { label: "所屬擴充包", val: catalog.setCode || "—" },
    {
      label: "資產屬性",
      val: formatElementTypeZh(catalog.elementType),
    },
    { label: "進化階段", val: catalog.pokemonStage?.trim() || "—" },
    { label: "HP", val: catalog.hp != null ? String(catalog.hp) : "—" },
    { label: "子分類", val: catalog.subTypeJa?.trim() || "—" },
  ].filter((row) => row.val !== "—");

  const galleryPhotos =
    photos.length > 0 ? photos : [catalog.imageUrl || "/placeholder-card.png"];

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
          <section className="lg:col-span-5 lg:sticky lg:top-[5.5rem] space-y-3.5 mb-6 lg:mb-0">
            <div className="relative w-full aspect-[5/3.8] bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden shadow-xl">
              <Image
                src={galleryPhotos[activeImageIndex] ?? galleryPhotos[0]}
                alt={`${catalog.productName} 賣家實物特寫角度 ${activeImageIndex + 1}`}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="inline-flex px-2 py-1 rounded bg-[#17130f]/85 backdrop-blur-sm border border-[rgba(237,232,224,0.15)] font-mono text-[9px] font-black text-brand uppercase tracking-widest">
                  📸 賣家實物 3D 多維存證圖
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {galleryPhotos.map((img, i) => (
                <button
                  key={`${img}-${i}`}
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
                  />
                  <div className="absolute bottom-1 right-1 font-mono text-[8px] bg-black/60 px-1 rounded text-[#eae1da] scale-90">
                    角 {i + 1}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="lg:col-span-7 space-y-5">
            <div>
              <span className="inline-flex font-mono text-[9px] bg-brand/10 text-brand px-2 py-0.5 rounded font-black border border-brand/20 uppercase tracking-widest">
                store exclusive item
              </span>
              <h1 className="font-sans font-black text-[24px] lg:text-[28px] text-[#eae1da] mt-1.5 leading-tight tracking-tight">
                {catalog.productName}
              </h1>
              <p className="font-mono text-[12px] text-text-disabled mt-1">
                官方卡號基準:{" "}
                <span className="text-[#eae1da] font-bold">
                  {cardCode || "未標註"}
                </span>{" "}
                · 出讓批次: {batchLabel || routeProductId}
              </p>
            </div>

            <div className="bg-[#26211C] p-5 rounded-2xl border border-[rgba(212,165,116,0.20)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
              <div>
                <span className="font-mono text-[10px] text-[#d4c4b7] block mb-1 uppercase tracking-wide">
                  店主獨立出讓一口價
                </span>
                <p className="font-mono font-black text-[30px] text-brand leading-none">
                  HK$ {price.toLocaleString("en-HK")}
                </p>
              </div>
              <BuyButton
                listing={storefrontListing}
                className="h-11 px-8 text-[13px] font-sans font-black rounded-xl shrink-0 active:scale-[0.97] transition-transform cursor-pointer"
              />
            </div>

            <Link
              href={publicProductHref}
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

            <div className="bg-[#26211C] rounded-xl border border-[rgba(237,232,224,0.08)] overflow-hidden font-sans text-[13px]">
              <div className="flex justify-between items-center p-3.5 bg-[#2c2722] border-b border-white/5">
                <span className="text-[#d4c4b7]">實物鑑定品品相評級</span>
                <div className="flex items-center gap-1.5">
                  <RarityBadge rarity={catalog.rarity} />
                  <GradeBadge
                    authority={grade.authority}
                    score={grade.score}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-[#26211C] border-b border-white/5">
                <span className="text-[#d4c4b7]">中介託管狀態</span>
                <span className="text-[#22c55e] font-bold flex items-center gap-1">
                  {detail.useAuthentication
                    ? "🔒 平台官方安全中介存證已鎖定"
                    : "C2C 直接交割模式"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-[#26211C]">
                <span className="text-[#d4c4b7]">賣家識別商號</span>
                <span className="font-mono text-[#eae1da]">
                  {seller.handle} ·{" "}
                  <span className="text-brand font-bold">
                    {seller.completedTrades.toLocaleString()}
                  </span>{" "}
                  筆歷史交割
                </span>
              </div>
            </div>

            {specRows.length > 0 ? (
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
                  {specRows.map((row, idx) => (
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
                </div>
              </div>
            ) : (
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

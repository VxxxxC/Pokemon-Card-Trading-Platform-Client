"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { WishlistButton } from "@/app/components/market/WishlistButton";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
// 引入全域原子級動作掣
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";

export type MarketplaceListing = {
  id: string;
  cardNo?: string;
  name: string;
  set: string;
  rarity: "SAR" | "UR" | "SR" | "AR";
  grade: { authority: string; score: string };
  conditionLabel?: "美品 S" | "微傷 A" | "傷 B";
  price: number; // HKD value
  delta: number;
  deltaDirection: "up" | "down";
  image: string;
  seller: string;
  sellerId?: string;
  detailHref?: string;
};

interface MarketplaceCardProps {
  listing: MarketplaceListing;
}

export function MarketplaceCard({ listing }: MarketplaceCardProps) {
  const formattedPrice = `HK$ ${listing.price.toLocaleString("en-HK")}`;
  const formattedDelta = `${listing.deltaDirection === "up" ? "▲" : "▼"} HK$ ${listing.delta.toLocaleString("en-HK")}`;
  const detailHref = listing.detailHref ?? `/marketplace/product/${listing.id}`;
  const displayCardNo = listing.cardNo ?? listing.id;

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group bg-[#26211C] rounded-2xl overflow-hidden border border-[rgba(237,232,224,0.08)] shadow-[0_2px_8px_rgba(0,0,0,0.40)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.65)] flex flex-col justify-between"
    >
      <div>
        <div className="relative w-full aspect-[5/3.8] overflow-hidden bg-[#1A1612]">
          {/* 🟢 核心修正 1：將卡片封面的 Link，精準正名並導向 /marketplace/product/[id] 公共大盤頁 */}
          <Link href={detailHref} className="block relative w-full h-full">
            <Image
              src={listing.image}
              alt={`${listing.name} — ${listing.rarity}`}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-[rgba(212,165,116,0.08)] to-[rgba(255,255,255,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_20%,rgba(255,255,255,0.15)_40%,rgba(255,255,255,0)_60%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
          </Link>

          <div className="absolute top-3 left-3 pointer-events-none">
            <RarityBadge rarity={listing.rarity} />
          </div>

          <div className="absolute top-3 right-3 z-10">
            <WishlistButton listingId={listing.id} />
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {/* 🟢 核心修正 2：將卡片標題的 Link，同步精準導向 /marketplace/product/[id] */}
              <Link href={detailHref}>
                <h3 className="font-sans font-semibold text-[15px] text-[#eae1da] leading-snug truncate hover:text-[#d4a574] transition-colors">
                  {listing.name}
                </h3>
              </Link>
              <span className="font-mono text-[11px] text-[#d4c4b7]">
                {displayCardNo} · {listing.set}
              </span>
            </div>
            <GradeBadge
              authority={listing.grade.authority}
              score={listing.grade.score}
            />
          </div>

          <div className="flex items-end justify-between pt-1">
            <div>
              <p className="font-mono font-bold text-[17px] text-[#eae1da] leading-none">
                {formattedPrice}
              </p>
              <span
                className={`font-mono text-[11px] inline-flex items-center gap-0.5 mt-1 ${listing.deltaDirection === "up" ? "text-[#10b981]" : "text-[#ef4444]"}`}
              >
                {formattedDelta}
              </span>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] text-[#50453b] uppercase tracking-wider">
                賣家
              </p>
              <p className="font-sans text-[12px] text-[#d4c4b7] truncate max-w-22.5 font-medium mt-0.5">
                {listing.seller}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 換上全域即時通訊按鈕，從此在大盤分頁點擊直接彈出交易 SlideOver！ */}
      <div className="px-4 pb-4 pt-1 w-full">
        <BuyButton listing={listing} className="w-full" />
      </div>
    </motion.article>
  );
}

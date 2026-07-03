"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { WishlistButton } from "@/app/components/market/WishlistButton";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
// 引入全域原子級動作掣
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";
import type { Tables } from "@/types/supabase";

export type MarketplaceListing = {
  /** Active listing id — used by wishlist / buy flows. */
  id: string;
  /** Product catalog id for `/marketplace/product/[id]` navigation. */
  productId?: string;
  cardNo?: string;
  name: string;
  set: string;
  rarity: Tables<"product_catalog">["rarity"];
  grade: { authority: string; score: string };
  conditionLabel?: "A" | "B" | "C" | "D";
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

function resolveProductDetailHref(listing: MarketplaceListing): string {
  return (
    listing.detailHref ??
    `/marketplace/product/${listing.productId ?? listing.id}`
  );
}

export function MarketplaceCard({ listing }: MarketplaceCardProps) {
  const router = useRouter();
  const productDetailHref = resolveProductDetailHref(listing);
  const formattedPrice = `HK$ ${listing.price.toLocaleString("en-HK")}`;
  const formattedDelta = `${listing.deltaDirection === "up" ? "▲" : "▼"} HK$ ${listing.delta.toLocaleString("en-HK")}`;
  const displayCardNo = listing.cardNo ?? listing.id;

  const openProductDetail = () => {
    router.push(productDetailHref);
  };

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group bg-[#26211C] rounded-2xl overflow-hidden border border-[rgba(237,232,224,0.08)] shadow-[0_2px_8px_rgba(0,0,0,0.40)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.65)] flex flex-col justify-between"
    >
      <div
        role="link"
        tabIndex={0}
        onClick={openProductDetail}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProductDetail();
          }
        }}
        className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        aria-label={`查看 ${listing.name} 商品詳情`}
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#1A1612]">
          <Image
            src={listing.image}
            alt={
              listing.rarity
                ? `${listing.name} — ${listing.rarity}`
                : listing.name
            }
            fill
            className="object-contain group-hover:scale-[1.03] transition-transform duration-300 p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-linear-to-tr from-transparent via-[rgba(212,165,116,0.08)] to-[rgba(255,255,255,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_20%,rgba(255,255,255,0.15)_40%,rgba(255,255,255,0)_60%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

          {listing.rarity ? (
            <div className="absolute top-3 left-3 pointer-events-none">
              <RarityBadge rarity={listing.rarity} />
            </div>
          ) : null}

          <div
            className="absolute top-3 right-3 z-10"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <WishlistButton listingId={listing.id} />
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2 min-w-0 w-full">
            <div className="min-w-0 w-full">
              <h3 className="font-sans font-semibold text-[14.5px] text-[#eae1da] leading-snug truncate group-hover:text-[#d4a574] transition-colors whitespace-nowrap block w-full">
                {listing.name}
              </h3>
              <span className="font-mono text-[11px] text-[#d4c4b7] block truncate">
                {displayCardNo}
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-1 gap-2 min-w-0 w-full">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <p className="font-mono font-bold tracking-tight text-[16px] text-[#eae1da] leading-none">
                  {formattedPrice}
                </p>
                <span
                  className={`font-mono text-[11px] whitespace-nowrap flex items-center gap-0.5 ${
                    listing.deltaDirection === "up" ? "text-[#10b981]" : "text-[#ef4444]"
                  }`}
                >
                  {formattedDelta}
                </span>
              </div>
            </div>
            <div className="text-right min-w-0 shrink-0">
              <p className="font-mono text-[9px] text-[#50453b] uppercase tracking-wider">
                賣家
              </p>
              <p className="truncate max-w-[90px] block font-sans whitespace-nowrap text-[12px] text-[#d4c4b7] font-medium mt-0.5">
                {listing.seller}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 換上全域即時通訊按鈕，從此在大盤分頁點擊直接彈出交易 SlideOver！ */}
      <div
        className="px-4 pb-4 pt-1 w-full"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <BuyButton listing={listing} className="w-full" />
      </div>
    </motion.article>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { WishlistButton, isWishlistFavored } from "@/app/components/market/WishlistButton";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
// 引入全域原子級動作掣
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";
import { PriceSpreadBadge } from "@/app/components/marketplace/PriceSpreadBadge";
import { CertifiedMerchantBadge } from "@/app/components/profile/CertifiedMerchantBadge";
import type { Database, Tables } from "@/types/supabase";
import { formatTradeGradeLabel } from "@/lib/marketplace/listing-display";
import { useCurrentUserId } from "@/app/lib/hooks/useCurrentUserId";

export type MarketplaceListing = {
  /** Active listing id — used by wishlist / buy flows. */
  id: string;
  /** Product catalog id for `/marketplace/product/[id]` navigation. */
  productId?: string;
  cardNo?: string;
  name: string;
  nameZh?: string | null;
  nameJa?: string | null;
  set: string;
  rarity: Tables<"product_catalog">["rarity"];
  grade: { authority: string; score: string };
  /** Raw DB values for wishlist / API — do not use display `grade` for mutations. */
  gradingCompany: string;
  gradingScore: string | null;
  conditionLabel?: "A" | "B" | "C" | "D";
  price: number; // HKD value
  delta: number;
  deltaDirection: "up" | "down";
  marketAvgPrice?: number | null;
  marketReferenceSource?: "snkrdunk" | "platform" | null;
  priceVsMarketPct?: number | null;
  image: string;
  catalogImageUrl?: string | null;
  seller: string;
  sellerId?: string;
  sellerPersona?: Database["public"]["Enums"]["seller_persona_type"];
  detailHref?: string;
  deliverySummary?: string;
  baseCourierShippingFee?: number;
  listingExtraShippingFee?: number;
  courierShippingTotal?: number;
};

interface MarketplaceCardProps {
  listing: MarketplaceListing;
  /** When provided, skips per-card profile fetch (pass from grid parent). */
  currentUserId?: string | null;
  /** Product+grade keys from `getUserWishlistFavoredKeys` for star hydration. */
  favoredKeys?: ReadonlySet<string>;
  imagePriority?: boolean;
}

function resolveProductDetailHref(listing: MarketplaceListing): string {
  const explicitHref = listing.detailHref?.trim();
  if (explicitHref) {
    return explicitHref;
  }

  const sellerId = listing.sellerId?.trim();
  const listingId = listing.id?.trim();
  if (sellerId && listingId) {
    return `/marketplace/${sellerId}/product/${listingId}`;
  }

  return `/marketplace/product/${listing.productId ?? listing.id}`;
}

function resolveListingDisplayName(listing: MarketplaceListing): string {
  const primary = listing.name?.trim();
  if (primary) return primary;

  const zh = listing.nameZh?.trim();
  if (zh) return zh;

  const ja = listing.nameJa?.trim();
  if (ja) return ja;

  return "未命名卡牌";
}

function hasDisplayableRarity(
  rarity: MarketplaceListing["rarity"],
): rarity is NonNullable<MarketplaceListing["rarity"]> {
  if (!rarity) return false;
  const trimmed = rarity.trim();
  return trimmed !== "" && trimmed !== "-";
}

function isRawGradeAuthority(authority: string): boolean {
  const normalized = authority.toUpperCase().trim();
  return normalized === "RAW" || normalized === "RAW CARD";
}

export function MarketplaceCard({
  listing,
  currentUserId: currentUserIdProp,
  favoredKeys,
  imagePriority = false,
}: MarketplaceCardProps) {
  if (currentUserIdProp !== undefined) {
    return (
      <MarketplaceCardView
        listing={listing}
        currentUserId={currentUserIdProp}
        favoredKeys={favoredKeys}
        imagePriority={imagePriority}
      />
    );
  }

  return (
    <MarketplaceCardWithSession
      listing={listing}
      favoredKeys={favoredKeys}
      imagePriority={imagePriority}
    />
  );
}

function MarketplaceCardWithSession({
  listing,
  favoredKeys,
  imagePriority,
}: Pick<MarketplaceCardProps, "listing" | "favoredKeys" | "imagePriority">) {
  const currentUserId = useCurrentUserId();
  return (
    <MarketplaceCardView
      listing={listing}
      currentUserId={currentUserId}
      favoredKeys={favoredKeys}
      imagePriority={imagePriority}
    />
  );
}

function MarketplaceCardView({
  listing,
  currentUserId,
  favoredKeys,
  imagePriority,
}: {
  listing: MarketplaceListing;
  currentUserId: string | null;
  favoredKeys?: ReadonlySet<string>;
  imagePriority?: boolean;
}) {
  const isOwnListing =
    currentUserId != null &&
    listing.sellerId != null &&
    listing.sellerId === currentUserId;
  const productDetailHref = resolveProductDetailHref(listing);
  const formattedPrice = `HK$ ${listing.price.toLocaleString("en-HK")}`;
  const displayCardNo = listing.cardNo ?? listing.id;
  const displaySetAndCardNo = listing.set
    ? `${listing.set.toUpperCase()} · ${displayCardNo}`
    : displayCardNo;
  const displayName = resolveListingDisplayName(listing);
  const wishlistProductId = listing.productId ?? listing.id;
  const wishlistIsFavored = isWishlistFavored(
    favoredKeys,
    wishlistProductId,
    listing.gradingCompany,
    listing.gradingScore,
  );

  return (
    <div
      className={`h-full ${isOwnListing ? "rounded-xl ring-2 ring-brand/50 ring-offset-2 ring-offset-[#17130f]" : ""}`}
    >
    <motion.article
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group bg-[#26211C] rounded-xl overflow-hidden border border-white/[0.06] flex flex-col h-full"
    >
      <Link
        href={productDetailHref}
        prefetch
        className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 flex flex-col flex-1 min-h-0"
        aria-label={`查看 ${displayName} 商品詳情`}
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#17130f]">
          <Image
            src={listing.image}
            alt={
              hasDisplayableRarity(listing.rarity)
                ? `${displayName} — ${listing.rarity}`
                : displayName
            }
            fill
            className="object-contain p-1.5 group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 640px) 33vw, (max-width: 1280px) 25vw, 20vw"
            priority={imagePriority ?? false}
            loading={imagePriority ? undefined : "lazy"}
          />
          <div className="absolute inset-0 bg-linear-to-tr from-transparent via-[rgba(212,165,116,0.06)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {hasDisplayableRarity(listing.rarity) ? (
            <div className="absolute top-1.5 left-1.5 pointer-events-none">
              <RarityBadge rarity={listing.rarity} />
            </div>
          ) : null}

          {isOwnListing ? (
            <div className="absolute bottom-1.5 left-1.5 pointer-events-none z-20">
              <span className="font-mono text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-brand text-[#1A1612]">
                我的掛單
              </span>
            </div>
          ) : null}

          <div
            className="absolute top-1.5 right-1.5 z-10"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <WishlistButton
              productId={wishlistProductId}
              gradingCompany={listing.gradingCompany}
              gradingScore={listing.gradingScore}
              trackedPrice={listing.price > 0 ? listing.price : null}
              initialIsFavored={wishlistIsFavored}
              currentUserId={currentUserId}
            />
          </div>
        </div>

        <div className="p-2 space-y-1">
          <h3 className="font-sans font-semibold text-[12px] text-[#eae1da] leading-tight truncate group-hover:text-brand transition-colors">
            {displayName}
          </h3>
          <p className="font-mono text-[10px] text-[#8A8680] truncate leading-tight">
            {displaySetAndCardNo}
          </p>
          <div className="flex items-center justify-between gap-1 min-w-0">
            <div className="min-w-0 shrink">
              {isRawGradeAuthority(listing.grade.authority) ? (
                <span className="inline-flex font-mono text-[10px] font-medium text-text-primary bg-brand/15 rounded px-1.5 py-0.5">
                  {formatTradeGradeLabel(
                    listing.grade.authority,
                    listing.grade.score || null,
                  )}
                </span>
              ) : (
                <GradeBadge
                  authority={listing.grade.authority}
                  score={listing.grade.score}
                  size="sm"
                />
              )}
            </div>
            <p className="font-mono font-bold text-[13px] text-[#eae1da] leading-none shrink-0">
              {formattedPrice}
            </p>
          </div>
          {listing.priceVsMarketPct != null ? (
            <div className="min-h-[14px]">
              <PriceSpreadBadge
                priceVsMarketPct={listing.priceVsMarketPct}
                className="text-[9px] min-w-0 truncate"
              />
            </div>
          ) : null}
          <div className="flex items-center gap-1 min-h-[20px] min-w-0">
            {listing.sellerPersona === "merchant" ? (
              <CertifiedMerchantBadge className="shrink-0 scale-[0.92] origin-left" />
            ) : null}
            <p className="truncate font-sans text-[10px] text-[#8A8680] min-w-0 flex-1 leading-tight">
              {listing.seller}
              {isOwnListing ? (
                <span className="text-brand font-bold"> (你)</span>
              ) : null}
            </p>
          </div>
        </div>
      </Link>

      <div
        className="px-2 pb-2 pt-1 mt-auto shrink-0 w-full"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {isOwnListing ? (
          <button
            type="button"
            disabled
            className="w-full h-8 px-2 bg-[#1A1612] border border-brand/30 text-brand/70 font-sans font-bold text-[10px] tracking-wide whitespace-nowrap truncate rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
          >
            我的掛單 · 無法出價
          </button>
        ) : (
          <BuyButton
            listing={listing}
            className="w-full"
            currentUserId={currentUserId}
          />
        )}
      </div>
    </motion.article>
    </div>
  );
}

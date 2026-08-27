"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  type MarketplaceListing,
} from "@/app/components/marketplace/MarketplaceCard";
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";
import {
  WishlistButton,
  isWishlistFavored,
} from "@/app/components/market/WishlistButton";
import { CertifiedMerchantBadge } from "@/app/components/profile/CertifiedMerchantBadge";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import {
  HOME_GRID_CARD_CLASS,
  HOME_GRID_CARD_SIZES,
  HOME_HORIZONTAL_CARD_IMAGE_CLASS,
} from "@/app/components/home/home-section-ui";
import { formatTradeGradeLabel } from "@/lib/marketplace/listing-display";

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

function ShelfCardImage({
  imageUrl,
  catalogImageUrl,
  alt,
  priority,
}: {
  imageUrl: string;
  catalogImageUrl?: string | null;
  alt: string;
  priority: boolean;
}) {
  const primarySrc = imageUrl.trim() || catalogImageUrl?.trim() || "";
  const catalogSrc = catalogImageUrl?.trim() ?? "";
  const [errorStage, setErrorStage] = useState<0 | 1 | 2>(0);
  const src =
    errorStage === 0 ? primarySrc : errorStage === 1 ? catalogSrc : "";

  const handleError = () => {
    if (errorStage === 0 && catalogSrc && primarySrc !== catalogSrc) {
      setErrorStage(1);
      return;
    }
    setErrorStage(2);
  };

  if (!src || errorStage === 2) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#1A1612] text-text-disabled font-mono text-[10px]">
        暫無圖片
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover group-hover:scale-[1.05] transition-transform duration-500 pointer-events-none"
      sizes={HOME_GRID_CARD_SIZES}
      priority={priority}
      onError={handleError}
    />
  );
}

export type HomeShelfListingCardProps = {
  listing: MarketplaceListing;
  currentUserId?: string | null;
  favoredKeys?: ReadonlySet<string>;
  imagePriority?: boolean;
  catalogImageUrl?: string | null;
  listedLabel?: string | null;
  showWishlist?: boolean;
  showSeller?: boolean;
  showMerchantBadge?: boolean;
  className?: string;
  layout?: "shelf" | "grid";
  onLinkClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function HomeShelfListingCard({
  listing,
  currentUserId = null,
  favoredKeys,
  imagePriority = false,
  catalogImageUrl,
  listedLabel,
  showWishlist = true,
  showSeller = true,
  showMerchantBadge = true,
  className,
  layout = "shelf",
  onLinkClick,
}: HomeShelfListingCardProps) {
  const isOwnListing =
    currentUserId != null &&
    listing.sellerId != null &&
    listing.sellerId === currentUserId;
  const productDetailHref = resolveProductDetailHref(listing);
  const displayCardNo = listing.cardNo ?? listing.id;
  const displaySetLine = listing.set
    ? `${listing.set.toUpperCase()} · ${displayCardNo}`
    : displayCardNo;
  const displayName = resolveListingDisplayName(listing);
  const bodyPaddingClass = layout === "grid" ? "p-2 space-y-1" : "p-3 space-y-1";
  const actionPaddingClass =
    layout === "grid" ? "px-2 pb-2 pt-0.5" : "px-3 pb-3 pt-0.5";
  const titleClass =
    layout === "grid"
      ? "font-sans font-bold text-[12px] text-text-primary truncate leading-tight mb-0.5 group-hover:text-brand transition-colors"
      : "font-sans font-bold text-[13px] text-text-primary truncate leading-tight mb-0.5 group-hover:text-brand transition-colors";
  const priceClass =
    layout === "grid"
      ? "font-mono font-bold text-[13px] text-brand leading-none tabular-nums shrink-0"
      : "font-mono font-bold text-[14px] text-brand leading-none tabular-nums shrink-0";
  const wishlistProductId = listing.productId ?? listing.id;
  const wishlistIsFavored = isWishlistFavored(
    favoredKeys,
    wishlistProductId,
    listing.gradingCompany,
    listing.gradingScore,
  );
  const gradeLabel = formatTradeGradeLabel(
    listing.grade.authority,
    listing.grade.score || null,
  );

  return (
    <div
      className={`h-full ${isOwnListing ? "rounded-xl ring-2 ring-brand/50 ring-offset-2 ring-offset-[#17130f]" : ""}`}
    >
      <article
        className={`${HOME_GRID_CARD_CLASS} ${className ?? ""}`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <Link
            href={productDetailHref}
            prefetch
            onClick={onLinkClick}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-inset"
            aria-label={`查看 ${displayName} 商品詳情`}
          >
            <div className={`${HOME_HORIZONTAL_CARD_IMAGE_CLASS} group`}>
              <ShelfCardImage
                imageUrl={listing.image}
                catalogImageUrl={catalogImageUrl ?? listing.catalogImageUrl}
                alt={
                  hasDisplayableRarity(listing.rarity)
                    ? `${displayName} — ${listing.rarity}`
                    : displayName
                }
                priority={imagePriority}
              />
              <span className="absolute top-2 left-2 pointer-events-none">
                <p className="self-start font-mono text-[10px] font-bold text-text-primary bg-[rgba(23,19,15,0.85)] backdrop-blur-md px-2 py-0.5 rounded-[4px] leading-none border border-white/10">
                  {gradeLabel}
                </p>
              </span>
              {showWishlist ? (
                <div
                  className="absolute top-2 right-2 z-20"
                  onClick={(event) => event.stopPropagation()}
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
              ) : null}
              {listedLabel ? (
                <span className="absolute bottom-0 right-0 left-0 text-center font-mono text-[10px] text-text-disabled bg-[rgba(23,19,15,0.75)] backdrop-blur-md py-1 pointer-events-none">
                  {listedLabel}
                </span>
              ) : null}
            </div>

            <div className={bodyPaddingClass}>
              <div className="space-y-0.5">
                <h3 className={titleClass}>{displayName}</h3>
                <p className="font-mono text-[10px] text-text-disabled truncate leading-tight">
                  {displaySetLine}
                </p>
                {hasDisplayableRarity(listing.rarity) ? (
                  <div className="pt-0.5">
                    <RarityBadge
                      rarity={listing.rarity}
                      className={
                        layout === "grid"
                          ? "text-[9px] px-1.5 py-0"
                          : undefined
                      }
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-1 min-w-0">
                <p className={priceClass}>
                  HK$ {listing.price.toLocaleString("en-HK")}
                </p>
                {showSeller ? (
                  <span className="font-sans text-[10px] text-text-secondary truncate max-w-[4.5rem] text-right">
                    {listing.seller}
                    {isOwnListing ? (
                      <span className="text-brand font-bold"> (你)</span>
                    ) : null}
                  </span>
                ) : null}
              </div>
              {showMerchantBadge && listing.sellerPersona === "merchant" ? (
                <div className="pt-0.5">
                  <CertifiedMerchantBadge className="scale-[0.92] origin-left" />
                </div>
              ) : null}
            </div>
          </Link>

          <div className={`${actionPaddingClass} w-full mt-auto shrink-0`}>
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
                className="w-full py-1 h-8 text-[12px]"
                currentUserId={currentUserId}
              />
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import {
  HOME_GRID_CARD_CLASS,
  HOME_GRID_CARD_SIZES,
  HOME_HORIZONTAL_CARD_IMAGE_CLASS,
} from "@/app/components/home/home-section-ui";

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
  const router = useRouter();
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
  const isGridLayout = layout === "grid";
  const bodyPaddingClass = isGridLayout
    ? "px-1.5 pt-1.5 pb-1 space-y-0.5"
    : "p-3 space-y-1";
  const actionPaddingClass = isGridLayout
    ? "px-1.5 pb-1.5 pt-0.5"
    : "px-3 pb-3 pt-0.5";
  const titleClass = isGridLayout
    ? "font-sans font-semibold text-[12px] text-[#eae1da] truncate leading-tight group-hover:text-brand transition-colors"
    : "font-sans font-bold text-[13px] text-text-primary truncate leading-tight mb-0.5 group-hover:text-brand transition-colors";
  const metaClass = isGridLayout
    ? "font-mono text-[9px] text-[#8A8680] truncate leading-tight"
    : "font-mono text-[10px] text-text-disabled truncate leading-tight";
  const priceClass = isGridLayout
    ? "font-mono font-bold text-[12px] text-brand leading-none tabular-nums shrink-0"
    : "font-mono font-bold text-[14px] text-brand leading-none tabular-nums shrink-0";
  const imageAreaClass = isGridLayout
    ? "relative w-full aspect-[3/4] overflow-hidden bg-[#17130f]"
    : HOME_HORIZONTAL_CARD_IMAGE_CLASS;
  const buyButtonClass = isGridLayout
    ? "w-full h-7 px-1 text-[10px]"
    : "w-full py-1 h-8 text-[12px]";
  const wishlistProductId = listing.productId ?? listing.id;
  const wishlistIsFavored = isWishlistFavored(
    favoredKeys,
    wishlistProductId,
    listing.gradingCompany,
    listing.gradingScore,
  );

  const handleCardActivate = (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("[data-shelf-card-action]")) {
      return;
    }

    if (onLinkClick) {
      onLinkClick(event as unknown as MouseEvent<HTMLAnchorElement>);
      if (event.defaultPrevented) {
        return;
      }
    }

    router.push(productDetailHref);
  };

  return (
    <div
      className="h-full"
    >
      <article
        role="link"
        tabIndex={0}
        onClick={handleCardActivate}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }
          event.preventDefault();
          handleCardActivate(event as unknown as MouseEvent<HTMLElement>);
        }}
        className={`relative cursor-pointer ${HOME_GRID_CARD_CLASS} ${className ?? ""}`}
      >
        <div className="relative flex flex-col flex-1 min-h-0">
          <div className={`${imageAreaClass} group`}>
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
            {isGridLayout && hasDisplayableRarity(listing.rarity) ? (
              <div className="absolute bottom-1.5 right-1.5 pointer-events-none z-10">
                <RarityBadge rarity={listing.rarity} size="sm" />
              </div>
            ) : !isGridLayout ? (
              <div className="absolute top-2 left-2 pointer-events-none z-10">
                <GradeBadge
                  authority={listing.grade.authority}
                  score={listing.grade.score}
                  size="sm"
                />
              </div>
            ) : null}
            {showWishlist ? (
              <div
                className="absolute top-1 right-1 z-20"
                data-shelf-card-action="true"
              >
                <WishlistButton
                  productId={wishlistProductId}
                  gradingCompany={listing.gradingCompany}
                  gradingScore={listing.gradingScore}
                  trackedPrice={listing.price > 0 ? listing.price : null}
                  initialIsFavored={wishlistIsFavored}
                  currentUserId={currentUserId}
                  size="sm"
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
            <h3 className={titleClass}>{displayName}</h3>
            <p className={metaClass}>{displaySetLine}</p>
            <div className="flex items-center justify-between gap-1 min-w-0 pt-0.5">
              <p className={priceClass}>
                HK$ {listing.price.toLocaleString("en-HK")}
              </p>
              {showSeller && !isGridLayout ? (
                <span className="font-sans text-[10px] text-text-secondary truncate max-w-[4.5rem] text-right">
                  {listing.seller}
                  {isOwnListing ? (
                    <span className="text-brand font-bold"> (你)</span>
                  ) : null}
                </span>
              ) : null}
            </div>
            {isGridLayout ? (
              <div className="min-h-[16px]">
                <GradeBadge
                  authority={listing.grade.authority}
                  score={listing.grade.score}
                  size="sm"
                />
              </div>
            ) : null}
            {!isGridLayout && hasDisplayableRarity(listing.rarity) ? (
              <div className="pt-0.5">
                <RarityBadge rarity={listing.rarity} size="sm" />
              </div>
            ) : null}
            {showSeller && isGridLayout ? (
              <div className="flex items-center gap-1 min-h-[18px] min-w-0">
                {showMerchantBadge && listing.sellerPersona === "merchant" ? (
                  <CertifiedMerchantBadge className="shrink-0 scale-[0.92] origin-left" />
                ) : null}
                <p className="truncate font-sans text-[10px] text-[#8A8680] min-w-0 flex-1 leading-tight">
                  {listing.seller}
                  {isOwnListing ? (
                    <span className="text-brand font-bold"> (你)</span>
                  ) : null}
                </p>
              </div>
            ) : null}
            {!isGridLayout && showMerchantBadge && listing.sellerPersona === "merchant" ? (
              <div className="pt-0.5">
                <CertifiedMerchantBadge className="scale-[0.92] origin-left" />
              </div>
            ) : null}
          </div>

          <div
            className={`${actionPaddingClass} w-full mt-auto shrink-0`}
            data-shelf-card-action={isOwnListing ? undefined : "true"}
          >
            {isOwnListing ? (
              <button
                type="button"
                disabled
                className={`${buyButtonClass} bg-[#1A1612] text-brand/70 font-sans font-bold tracking-wide whitespace-nowrap truncate rounded-lg cursor-not-allowed flex items-center justify-center gap-0.5`}
              >
                我的掛單 · 無法出價
              </button>
            ) : (
              <BuyButton
                listing={listing}
                className={buyButtonClass}
                currentUserId={currentUserId}
              />
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { HomeListingCard } from "@/app/lib/home/types";
import {
  WishlistButton,
  isWishlistFavored,
} from "@/app/components/market/WishlistButton";
import { useIsMemberPersonaActive } from "@/app/lib/hooks/useIsMemberPersonaActive";
import { buildSellerListingDetailHref } from "@/lib/marketplace/listing-detail-href";
import {
  HOME_SECTION_CLASS,
  HOME_SECTION_HEADER_ROW_CLASS,
  HOME_SECTION_LINK_CLASS,
  HOME_SECTION_TITLE_CLASS,
} from "@/app/components/home/home-section-ui";

type PremiumMarketProps = {
  listings?: HomeListingCard[];
  currentUserId?: string | null;
  favoredKeys?: string[];
};

function ListingCoverImage({
  listing,
  index,
}: {
  listing: HomeListingCard;
  index: number;
}) {
  const [src, setSrc] = React.useState(
    () => listing.imageUrl.trim() || listing.catalogImageUrl?.trim() || "",
  );
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setSrc(listing.imageUrl.trim() || listing.catalogImageUrl?.trim() || "");
    setFailed(false);
  }, [listing.imageUrl, listing.catalogImageUrl, listing.listingId]);

  const handleError = () => {
    const catalog = listing.catalogImageUrl?.trim();
    if (catalog && src !== catalog) {
      setSrc(catalog);
      return;
    }
    setFailed(true);
  };

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-bg-elevated text-text-disabled font-mono text-[10px]">
        暫無圖片
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={`${listing.name} — ${listing.gradeLabel}`}
      fill
      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
      sizes="(max-width: 768px) 67vw, 220px"
      priority={index < 3}
      onError={handleError}
    />
  );
}

export function PremiumMarket({
  listings = [],
  currentUserId = null,
  favoredKeys = [],
}: PremiumMarketProps) {
  const isMemberPersonaActive = useIsMemberPersonaActive();
  const showWishlist = currentUserId != null && isMemberPersonaActive;
  const favoredKeySet = new Set(favoredKeys);

  const plugin = React.useMemo(
    () =>
      Autoplay({
        delay: 2500,
        playOnInit: listings.length > 1,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
      }),
    [listings.length],
  );

  return (
    <section
      className={HOME_SECTION_CLASS}
      aria-labelledby="premium-heading"
    >
      <div className={HOME_SECTION_HEADER_ROW_CLASS}>
        <h2 id="premium-heading" className={HOME_SECTION_TITLE_CLASS}>
          認證商家・鑑定託管保障
        </h2>
        <Link href="/marketplace" className={HOME_SECTION_LINK_CLASS}>
          查看全部 →
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="font-sans text-[13px] text-text-secondary py-6 text-center border border-[rgba(237,232,224,0.08)] rounded-xl bg-bg-card">
          暫無認證商家現貨上架
        </p>
      ) : (
        <Carousel
          plugins={[plugin]}
          className="w-full"
          onMouseEnter={plugin.stop}
          onMouseLeave={plugin.reset}
          opts={{
            align: "start",
            loop: listings.length > 1,
          }}
        >
          <CarouselContent className="-ml-2">
            {listings.map((listing, index) => {
              const detailHref = buildSellerListingDetailHref(
                listing.sellerId,
                listing.listingId,
              );

              return (
              <CarouselItem
                key={listing.listingId}
                className="pl-2 basis-2/3 sm:basis-[27%] lg:basis-[17%]"
              >
                <article className="flex flex-col h-full bg-bg-card rounded-xl border border-[rgba(237,232,224,0.08)] p-2.5 hover:bg-[#26211C] transition-colors group">
                  <Link
                    href={detailHref}
                    className="relative w-full aspect-[3/4] mx-auto rounded-lg overflow-hidden bg-bg-elevated block mb-2 border border-white/5"
                  >
                    <ListingCoverImage listing={listing} index={index} />
                    {showWishlist && (
                      <div className="absolute top-3 right-3 z-10 animate-fadeIn">
                        <WishlistButton
                          productId={listing.productId}
                          gradingCompany={listing.gradingCompany}
                          gradingScore={listing.gradingScore}
                          trackedPrice={listing.price > 0 ? listing.price : null}
                          currentUserId={currentUserId}
                          initialIsFavored={isWishlistFavored(
                            favoredKeySet,
                            listing.productId,
                            listing.gradingCompany,
                            listing.gradingScore,
                          )}
                        />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0 mb-2 space-y-0.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <Link
                        href={detailHref}
                      >
                        <h3 className="font-sans font-bold text-[13px] text-text-primary truncate hover:text-brand transition-colors">
                          {listing.name}
                        </h3>
                      </Link>
                      <span className="font-mono text-[9px] text-[#17130f] bg-brand px-1 py-0.5 rounded-[3px] shrink-0 font-black">
                        {listing.gradeLabel}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-text-disabled truncate">
                      {listing.cardCode || listing.productId} · {listing.sellerName}
                    </p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="font-mono text-[8px] font-bold text-brand bg-[rgba(212,165,116,0.12)] px-1 py-0.5 rounded-[3px] border border-brand/10">
                        🏅 {listing.sellerBadge}
                      </span>
                      <span className="font-mono text-[9px] text-text-disabled">
                        {listing.photoCount} 張實物圖
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 border-t border-[rgba(237,232,224,0.08)]">
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <span className="font-mono text-[8px] text-text-disabled">
                        託管價
                      </span>
                      <p className="font-mono font-black text-[14px] text-brand leading-none">
                        HK$ {listing.price.toLocaleString("en-HK")}
                      </p>
                    </div>

                    <Link
                      href={`/profile/${listing.sellerId}`}
                      className="w-full h-8 bg-[#17130f] border border-white/5 text-text-secondary hover:text-brand hover:border-brand/30 font-sans font-bold text-[11px] rounded-lg transition-all whitespace-nowrap inline-flex items-center justify-center cursor-pointer"
                    >
                      🏪 進入 {listing.sellerName}
                    </Link>
                  </div>
                </article>
              </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      )}
    </section>
  );
}

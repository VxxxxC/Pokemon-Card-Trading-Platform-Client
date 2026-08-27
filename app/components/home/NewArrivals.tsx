"use client";

import { useState, useRef, useEffect, PointerEvent, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useAnimationControls, PanInfo } from "framer-motion";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import type { HomeListingCard } from "@/app/lib/home/types";
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";
import { WishlistButton, isWishlistFavored } from "@/app/components/market/WishlistButton";
import { useIsMemberPersonaActive } from "@/app/lib/hooks/useIsMemberPersonaActive";
import { buildSellerListingDetailHref } from "@/lib/marketplace/listing-detail-href";
import {
  formatListingGrade,
  formatRelativeDateTime,
} from "@/lib/marketplace/listing-display";
import {
  HOME_SECTION_CLASS,
  HOME_SECTION_HEADER_ROW_CLASS,
  HOME_SECTION_LINK_CLASS,
  HOME_SECTION_TITLE_CLASS,
  HOME_HORIZONTAL_CARD_CLASS,
  HOME_HORIZONTAL_CARD_IMAGE_CLASS,
  HOME_HORIZONTAL_CARD_SIZES,
} from "@/app/components/home/home-section-ui";

function ArrivalCardImage({
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
      sizes={HOME_HORIZONTAL_CARD_SIZES}
      priority={priority}
      onError={handleError}
    />
  );
}

type NewArrivalsProps = {
  listings?: HomeListingCard[];
  currentUserId?: string | null;
  favoredKeys?: string[];
};

function toMarketplaceListing(card: HomeListingCard): MarketplaceListing {
  const grade = formatListingGrade(card.gradingCompany, card.gradingScore);

  return {
    id: card.listingId,
    productId: card.productId,
    cardNo: card.cardCode || card.displayId || card.productId,
    name: card.name,
    set: card.setCode,
    rarity: card.rarity,
    grade: {
      authority: grade.authority,
      score: grade.score || card.gradeLabel,
    },
    gradingCompany: card.gradingCompany,
    gradingScore: card.gradingScore,
    price: card.price,
    delta: 0,
    deltaDirection: "up",
    image: card.imageUrl,
    seller: card.sellerName,
    sellerId: card.sellerId,
    detailHref: buildSellerListingDetailHref(card.sellerId, card.listingId),
  };
}

export function NewArrivals({
  listings = [],
  currentUserId = null,
  favoredKeys = [],
}: NewArrivalsProps) {
  const isMemberPersonaActive = useIsMemberPersonaActive();
  const showWishlist = currentUserId != null && isMemberPersonaActive;
  const favoredKeySet = new Set(favoredKeys);
  const arrivals = useMemo(
    () => listings.map(toMarketplaceListing),
    [listings],
  );

  const tripleArrivals =
    arrivals.length > 0
      ? [...arrivals, ...arrivals, ...arrivals]
      : [];

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();

  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const currentX = useRef(0);

  useEffect(() => {
    if (containerRef.current && trackRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const trackWidth = trackRef.current.scrollWidth;
      setDragConstraints({
        left: -(trackWidth - containerWidth),
        right: 0,
      });
    }
  }, [tripleArrivals.length]);

  useEffect(() => {
    if (arrivals.length === 0) return;

    let animationFrameId: number;
    const speed = 0.6;

    const animate = () => {
      if (!isUserInteracting && trackRef.current) {
        currentX.current -= speed;

        const halfWidth = trackRef.current.scrollWidth / 3;
        if (Math.abs(currentX.current) >= halfWidth * 2) {
          currentX.current = -halfWidth;
        }

        controls.set({ x: currentX.current });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isUserInteracting, controls, arrivals.length]);

  const handleDrag = (
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => {
    if (trackRef.current) {
      currentX.current += info.delta.x;
    }
  };

  const listingCreatedAtById = useMemo(
    () => new Map(listings.map((row) => [row.listingId, row.createdAt])),
    [listings],
  );

  return (
    <section
      className={HOME_SECTION_CLASS}
      aria-labelledby="arrivals-heading"
    >
      <div className={HOME_SECTION_HEADER_ROW_CLASS}>
        <h2 id="arrivals-heading" className={HOME_SECTION_TITLE_CLASS}>
          最新會員現貨上架
        </h2>
        <Link
          href="/marketplace?filter=c2c&sort=newest"
          className={HOME_SECTION_LINK_CLASS}
        >
          查看全部 →
        </Link>
      </div>

      {arrivals.length === 0 ? (
        <p className="font-sans text-[13px] text-text-secondary py-6 text-center border border-[rgba(237,232,224,0.08)] rounded-xl bg-[#26211C]">
          暫無會員現貨上架
        </p>
      ) : (
        <div
          ref={containerRef}
          className="w-full overflow-hidden pb-4 -mx-1 px-1 scrollbar-none [&::-webkit-scrollbar]:hidden select-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onMouseEnter={() => setIsUserInteracting(true)}
          onMouseLeave={() => setIsUserInteracting(false)}
          onTouchStart={() => setIsUserInteracting(true)}
          onTouchEnd={() => setIsUserInteracting(false)}
        >
          <motion.div
            ref={trackRef}
            drag="x"
            dragConstraints={dragConstraints}
            dragElastic={0.1}
            onDrag={handleDrag}
            animate={controls}
            className="flex gap-3 w-max active:cursor-grabbing cursor-grab"
          >
            {tripleArrivals.map((item, index) => {
              const sourceCard = listings[index % listings.length];
              const listedLabel = formatRelativeDateTime(
                listingCreatedAtById.get(item.id) ?? sourceCard?.createdAt,
              );
              const detailHref =
                item.sellerId && item.id
                  ? buildSellerListingDetailHref(item.sellerId, item.id)
                  : item.detailHref ?? "/marketplace";

              return (
                <article
                  key={`${item.id}-${index}`}
                  onClick={(e) => isUserInteracting && e.stopPropagation()}
                  className={`${HOME_HORIZONTAL_CARD_CLASS} hover:border-brand/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.55)] transition-all group flex flex-col justify-between select-none`}
                >
                  <div>
                    <Link
                      href={detailHref}
                      className={`block ${HOME_HORIZONTAL_CARD_IMAGE_CLASS}`}
                      onClick={(e) => {
                        if (isUserInteracting) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <ArrivalCardImage
                        key={`${item.id}-${item.image}-${sourceCard?.catalogImageUrl ?? ""}`}
                        imageUrl={item.image}
                        catalogImageUrl={sourceCard?.catalogImageUrl}
                        alt={`${item.name} — ${item.rarity}`}
                        priority={index < 3}
                      />
                      <span className="absolute top-2.5 left-2.5 flex flex-col gap-y-1">
                        <p className="self-start font-mono text-[10px] font-bold text-text-primary bg-[rgba(23,19,15,0.85)] backdrop-blur-md px-2 py-0.5 rounded-[4px] leading-none border border-white/10">
                          {item.grade.score}
                        </p>
                        {item.rarity ? (
                          <p className="self-start font-mono text-[10px] font-bold text-brand bg-[#26211C]/90 backdrop-blur-md px-2 py-0.5 rounded-[4px] leading-none border border-brand/30">
                            {item.rarity}
                          </p>
                        ) : null}
                      </span>
                      {showWishlist && sourceCard && (
                        <div
                          className="absolute top-2.5 right-2.5 z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WishlistButton
                            productId={sourceCard.productId}
                            gradingCompany={sourceCard.gradingCompany}
                            gradingScore={sourceCard.gradingScore}
                            trackedPrice={
                              sourceCard.price > 0 ? sourceCard.price : null
                            }
                            currentUserId={currentUserId}
                            initialIsFavored={isWishlistFavored(
                              favoredKeySet,
                              sourceCard.productId,
                              sourceCard.gradingCompany,
                              sourceCard.gradingScore,
                            )}
                          />
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 left-0 text-center font-mono text-[10px] text-text-disabled bg-[rgba(23,19,15,0.75)] backdrop-blur-md py-1">
                        {listedLabel}
                      </span>
                    </Link>

                    <div className="p-3 space-y-1">
                      <div>
                        <h3 className="font-sans font-bold text-[13px] md:text-base text-text-primary truncate leading-tight mb-0.5">
                          {item.name}
                        </h3>
                        <span className="font-mono text-[10px] md:text-[11px] text-text-disabled block truncate">
                          {item.set}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p className="font-mono font-bold text-[14px] md:text-lg text-brand leading-none">
                          HK$ {item.price.toLocaleString()}
                        </p>
                        <span className="font-sans text-[10px] text-text-secondary truncate max-w-[4.5rem] text-right">
                          {item.seller}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-0.5 w-full">
                    <BuyButton listing={item} className="w-full py-1 h-8 text-[12px]" />
                  </div>
                </article>
              );
            })}
          </motion.div>
        </div>
      )}
    </section>
  );
}

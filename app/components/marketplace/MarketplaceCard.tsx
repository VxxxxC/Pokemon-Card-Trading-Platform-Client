"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { WishlistButton } from "@/app/components/market/WishlistButton";

export type MarketplaceListing = {
  id: string;
  name: string;
  rarity: string;
  price: number;
  image: string;
  badge: string;
  seller: string;
};

export function MarketplaceCard({ listing }: { listing: MarketplaceListing }) {
  const formattedPrice = `¥${listing.price.toLocaleString("ja-JP")}`;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-[#26211C] rounded-[16px] overflow-hidden border border-[rgba(140,115,85,0.10)] shadow-[0_2px_8px_rgba(0,0,0,0.40)]"
    >
      <Link href={`/marketplace/${listing.id}`} className="block">
        {/* Image area — 75% of card via aspect ratio */}
        <div className="relative w-full aspect-[5/7] overflow-hidden bg-[#1e1914]">
          <Image
            src={listing.image}
            alt={listing.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover"
          />

          {/* Hype badge — absolute top-left */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] font-medium text-[#eae1da] bg-black/50 backdrop-blur-sm border border-[rgba(237,225,218,0.12)]">
              {listing.badge}
            </span>
          </div>

          {/* Rarity tag — absolute bottom-right */}
          <div className="absolute bottom-2.5 right-2.5">
            <span className="inline-flex px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold text-[#d4a574] bg-[#17130f]/70 backdrop-blur-sm border border-[#8c7355]/30">
              {listing.rarity}
            </span>
          </div>

          {/* Wishlist star — absolute top-right */}
          <div className="absolute top-2.5 right-2.5">
            <WishlistButton listingId={listing.id} />
          </div>
        </div>

        {/* Data row — below image */}
        <div className="px-3 pt-2.5 pb-3 space-y-1">
          <p className="font-sans text-[13px] font-medium text-[#eae1da] truncate leading-tight">
            {listing.name}
          </p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[15px] font-semibold text-[#10b981]">
              {formattedPrice}
            </p>
            <p className="font-mono text-[10px] text-[#8c7355] truncate max-w-[60px] text-right">
              {listing.seller}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

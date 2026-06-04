"use client";

import { useState, use, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";

interface InventoryItem {
  name: string;
  cardNo: string;
  grade: { authority: string; score: string };
  price: number;
  image: string;
  rarity: "SAR" | "UR" | "SR" | "AR";
}

const MERCHANT_INVENTORY_DB: Record<string, Record<string, InventoryItem>> = {
  "PKT-8839-44A": {
    "LST-001": {
      name: "Charizard ex SAR (噴火龍)",
      cardNo: "sv2a-182",
      grade: { authority: "PSA", score: "10" },
      price: 44800,
      rarity: "SAR",
      image: "https://picsum.photos/seed/char1/600/420",
    },
    "LST-002": {
      name: "Umbreon VMAX SA (月亮伊布)",
      cardNo: "s6a-095",
      grade: { authority: "BGS", score: "9.5" },
      price: 52000,
      rarity: "SAR",
      image: "https://picsum.photos/seed/umb1/600/420",
    },
    "LST-003": {
      name: "Pikachu AR (皮卡丘)",
      cardNo: "sv2a-215",
      grade: { authority: "PSA", score: "10" },
      price: 1200,
      rarity: "AR",
      image: "https://picsum.photos/seed/pika1/600/420",
    },
    "LST-004": {
      name: "Lillie SR (莉莉艾)",
      cardNo: "sm4plus-119",
      grade: { authority: "PSA", score: "9" },
      price: 185000,
      rarity: "SR",
      image: "https://picsum.photos/seed/lillie/600/420",
    },
  },
};

interface PageProps {
  params: Promise<{ id: string; productId: string }>;
}

export default function MerchantProductDetailPage({ params }: PageProps) {
  const { id, productId } = use(params);
  const merchantStock = MERCHANT_INVENTORY_DB[id];
  const item = merchantStock ? merchantStock[productId] : null;

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#17130f] py-20">
        <h1 className="text-xl font-sans font-bold text-text-disabled">
          未找到該私域現貨標的
        </h1>
        <Link
          href={`/marketplace/${id}`}
          className="text-brand text-sm mt-2 hover:underline"
        >
          返回商戶櫥窗
        </Link>
      </div>
    );
  }

  const currentListing: MarketplaceListing = {
    id: item.cardNo,
    name: item.name,
    set: "渡邊館藏特配",
    rarity: item.rarity,
    grade: item.grade,
    price: item.price,
    delta: 550,
    deltaDirection: "up",
    image: item.image,
    seller: "渡邊道館",
  };

  return (
    <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 lg:px-8 py-6 pb-32 animate-fadeIn">
      <div className="mb-4 font-mono text-[11px] text-[#d4c4b7]">
        <Link href={`/marketplace/${id}`} className="hover:text-brand">
          🏪 {id} 專屬櫥窗
        </Link>{" "}
        /{" "}
        <span className="text-[#8A8680] uppercase">
          {productId} SPECIFIC ITEM
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 items-start">
        <div className="lg:col-span-5">
          <div className="relative w-full aspect-[5/3.8] bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden shadow-xl">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-5">
          <div>
            <span className="font-mono text-[9px] bg-brand/10 text-brand px-2 py-0.5 rounded font-black border border-brand/20 uppercase tracking-widest">
              STORE EXCLUSIVE ITEM
            </span>
            <h1 className="font-sans font-black text-[24px] text-[#eae1da] mt-1.5">
              {item.name}
            </h1>
            <p className="font-mono text-[12px] text-text-disabled mt-0.5">
              官方卡號基準: {item.cardNo}
            </p>
          </div>

          <div className="bg-[#26211C] p-5 rounded-2xl border border-[rgba(212,165,116,0.20)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
            <div>
              <span className="font-mono text-[10px] text-[#d4c4b7] block mb-1 uppercase">
                店主獨立出讓一口價
              </span>
              <p className="font-mono font-black text-[28px] text-[#eae1da]">
                HK$ {item.price.toLocaleString()}
              </p>
            </div>
            <BuyButton
              listing={currentListing}
              className="h-11 px-8 text-[14px] font-bold shrink-0"
            />
          </div>

          <div className="bg-[#26211C] rounded-xl border border-[rgba(237,232,224,0.08)] overflow-hidden font-sans text-[13px]">
            <div className="flex justify-between p-3.5 bg-[#2c2722] border-b border-white/5">
              <span className="text-[#d4c4b7]">實物鑑定品相評級</span>
              <div className="flex items-center gap-1.5">
                <RarityBadge rarity={item.rarity} />
                <GradeBadge
                  authority={item.grade.authority}
                  score={item.grade.score}
                />
              </div>
            </div>
            <div className="flex justify-between p-3.5 bg-[#26211C] border-b border-white/5">
              <span className="text-[#d4c4b7]">中介託管狀態</span>
              <span className="text-success font-bold">
                🔒 平台官方安全中介存證已鎖定
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

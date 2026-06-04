"use client";

import { use, useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";
import {
  getPublicMemberById,
  getStorefrontListingsByMember,
} from "@/app/lib/mock-public-members";

interface PageProps {
  params: Promise<{ id: string; productId: string }>;
}

export default function MerchantProductDetailPage({ params }: PageProps) {
  const { id, productId } = use(params);
  const member = getPublicMemberById(id);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const storefrontListing = useMemo(() => {
    if (!member) return null;
    return getStorefrontListingsByMember(member).find(
      (listing) => listing.id === productId,
    );
  }, [member, productId]);

  const item = useMemo(() => {
    if (!member) return null;
    return (
      member.activeListings.find((listing) => listing.id === productId) ?? null
    );
  }, [member, productId]);

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!member || !item || !storefrontListing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#17130f] py-20">
        <h1 className="text-xl font-sans font-bold text-text-disabled">
          未找到該私域現貨標的
        </h1>
        <Link
          href={member ? `/marketplace/${member.id}` : "/marketplace"}
          className="text-brand text-sm mt-2 hover:underline"
        >
          {member ? "返回商戶櫥窗" : "返回全網大盤"}
        </Link>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 lg:px-8 py-6 pb-32 animate-fadeIn">
      <div className="mb-4 font-mono text-[11px] text-[#d4c4b7]">
        <Link href={`/marketplace/${id}`} className="hover:text-brand">
          🏪 {member.username} 私域櫥窗
        </Link>{" "}
        /{" "}
        <span className="text-[#8A8680] uppercase">
          {productId} specific item
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
              store exclusive item
            </span>
            <h1 className="font-sans font-black text-[24px] text-[#eae1da] mt-1.5">
              {item.name}
            </h1>
            <p className="font-mono text-[12px] text-text-disabled mt-0.5">
              官方卡號基準: {item.cardNo} · {item.set}
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
              <p
                className={`font-mono text-[11px] mt-1 ${
                  item.deltaDirection === "up"
                    ? "text-[#10b981]"
                    : "text-[#ef4444]"
                }`}
              >
                {item.deltaDirection === "up" ? "▲" : "▼"} HK${" "}
                {item.delta.toLocaleString()} vs 24h
              </p>
            </div>
            <BuyButton
              listing={storefrontListing}
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
              <span className="text-[#d4c4b7]">店主品相標註</span>
              <span className="font-mono text-[#eae1da]">
                {item.conditionLabel}
              </span>
            </div>
            <div className="flex justify-between p-3.5 bg-[#26211C] border-b border-white/5">
              <span className="text-[#d4c4b7]">中介託管狀態</span>
              <span className="text-success font-bold">
                🔒 平台官方安全中介存證已鎖定
              </span>
            </div>
            <div className="flex justify-between p-3.5 bg-[#26211C]">
              <span className="text-[#d4c4b7]">賣家識別</span>
              <span className="font-mono text-[#eae1da]">
                {member.handle} · {member.completedTrades.toLocaleString()}{" "}
                trades
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

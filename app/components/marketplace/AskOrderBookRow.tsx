"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { type SellOrder } from "@/app/lib/mock-data/cards";

interface AskOrderBookRowProps {
  order: SellOrder;
  idx: number;
  productId: string;
  onOpenGate: (order: SellOrder) => void;
  grade: { authority: string; score: string };
  rarity: "SAR" | "UR" | "SR" | "AR";
}

export function AskOrderBookRow({
  order,
  idx,
  onOpenGate,
  grade,
  rarity,
}: AskOrderBookRowProps) {
  return (
    <div className="space-y-2 w-full animate-fadeIn">
      {/* Main Interactive Row Layout Box */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenGate(order)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpenGate(order);
        }}
        className={`w-full bg-[#1A1612] hover:bg-[#2c2722] ${idx === 0 ? "border-brand/40 shadow-[0_0_15px_rgba(212,165,116,0.08)]" : "border-white/5"} py-2 px-4 flex items-center justify-between gap-4 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-brand/40`}
      >
        {/* Left Hand Container (Avatar + Identity Stack) - NOW COMPLETELY INERT */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="w-9 h-9 border border-white/10 rounded-full shrink-0 select-none">
            <AvatarImage
              src={`https://avatar.iran.liara.run/username?username=${order.sellerName}`}
              alt={order.sellerName}
            />
            <AvatarFallback className="bg-[#26211C] text-brand text-xs font-bold font-mono">
              {order.sellerName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col text-left min-w-0 space-y-0.5">
            <span className="font-sans font-extrabold text-[14.5px] text-[#eae1da] truncate select-none">
              {order.sellerName}
            </span>

            {/* Responsive Stack Defense Line */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* Trust Rating Stars — compact single star + score */}
              <div
                className="flex items-center gap-1 shrink-0 font-mono"
                title={`商戶信譽評級: ${order.sellerRating} 星`}
              >
                <span className="text-brand text-[11px]">⭐</span>
                <span className="text-[11px] font-bold text-[#d4c4b7]">
                  {order.sellerRating.toFixed(1)}
                </span>
                <span className="text-[10px] text-[#8A8680]">
                  (
                  {order.reviewCount ??
                    Math.round(order.sellerRating * 40 + 15)}{" "}
                  筆評價)
                </span>
              </div>

              {/* MOBILE ONLY METADATA BLOCK */}
              <div className="flex sm:hidden items-center gap-1 scale-[0.9] origin-left shrink-0">
                <RarityBadge rarity={rarity} />
                <GradeBadge authority={grade.authority} score={grade.score} />
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP ONLY METADATA BLOCK */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <RarityBadge rarity={rarity} />
          <GradeBadge authority={grade.authority} score={grade.score} />
        </div>

        {/* Right Hand Container (Financial Value Axis) */}
        <div className="text-right shrink-0">
          <span
            className={`font-mono font-black text-[16px] ${idx === 0 ? "text-brand" : "text-[#eae1da]"}`}
          >
            HK$ {order.price.toLocaleString("en-HK")}
          </span>
        </div>
      </div>
    </div>
  );
}

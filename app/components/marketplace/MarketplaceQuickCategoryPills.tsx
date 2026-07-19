"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  activeQuickCategoryFromParams,
  MARKETPLACE_QUICK_CATEGORIES,
  marketplaceHrefForQuickCategory,
} from "@/lib/marketplace/quick-categories";

export function MarketplaceQuickCategoryPills() {
  const searchParams = useSearchParams();
  const activeCategory = activeQuickCategoryFromParams(searchParams);

  return (
    <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-0.5">
      {MARKETPLACE_QUICK_CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <Link
            key={cat.id}
            href={marketplaceHrefForQuickCategory(cat.id)}
            className={`flex-shrink-0 h-8 px-3.5 rounded-full font-mono text-[12px] font-medium transition-all active:scale-[0.96] ${
              isActive
                ? "bg-[#8c7355]/20 text-[#d4a574] border border-[#8c7355]"
                : "bg-[#3A2F1F] text-[#d4c4b7] border border-transparent hover:border-[#8c7355]/30"
            }`}
          >
            {cat.label}
          </Link>
        );
      })}
    </div>
  );
}

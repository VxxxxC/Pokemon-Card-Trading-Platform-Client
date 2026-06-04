"use client";

import Image from "next/image";
import { type MarketplaceListing } from "../MarketplaceCard";

interface SmartSearchProps {
  query: string;
  onSelect: (name: string) => void;
  listings: MarketplaceListing[];
  isOpen: boolean;
}

export function SmartSearch({
  query,
  onSelect,
  listings,
  isOpen,
}: SmartSearchProps) {
  if (!isOpen || !query) return null;

  // Filter listings based on card name or code/id matching the query
  const normalizedQuery = query.toLowerCase();
  const suggestions = listings
    .filter((item) => {
      const searchableCardNo = (item.cardNo ?? item.id).toLowerCase();
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        searchableCardNo.includes(normalizedQuery)
      );
    })
    .slice(0, 5);

  if (suggestions.length === 0) return null;

  return (
    <div className="absolute top-[calc(100%+6px)] left-0 w-full z-30 bg-[#2e2925] border border-[rgba(237,232,224,0.12)] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.60)] overflow-hidden animate-fadeIn">
      <div className="px-3 py-2 border-b border-[rgba(237,232,224,0.06)]">
        <span className="font-mono text-[9px] text-[#8A8680] uppercase tracking-wider">
          💡 智慧聯想建議結果 ({suggestions.length})
        </span>
      </div>
      <ul className="divide-y divide-[rgba(237,232,224,0.04)]">
        {suggestions.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onSelect(item.name)}
              className="w-full flex items-center justify-between p-2.5 text-left hover:bg-[#39342f] transition-colors focus:bg-[#39342f] focus:outline-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Mini card thumbnail */}
                <div className="relative w-8 h-11 bg-[#1A1612] rounded border border-[rgba(237,232,224,0.08)] overflow-hidden shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-sans font-semibold text-[13px] text-[#eae1da] truncate">
                    {item.name}
                  </p>
                  <p className="font-mono text-[10px] text-[#d4c4b7] mt-0.5">
                    {item.cardNo ?? item.id} · {item.set}
                  </p>
                </div>
              </div>

              {/* Price & Badges */}
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-[13px] text-[#eae1da]">
                  HK$ {item.price.toLocaleString("en-HK")}
                </span>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-[#17130f] text-[#d4a574] border border-[#d4a574]/20">
                    {item.rarity}
                  </span>
                  <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-[rgba(140,115,85,0.12)] text-[#eae1da]">
                    {item.grade.authority} {item.grade.score}
                  </span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

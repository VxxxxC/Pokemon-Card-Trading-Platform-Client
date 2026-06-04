"use client";

import {
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { MarketplaceCard } from "@/app/components/marketplace/MarketplaceCard";
import { AccordionFilters } from "@/app/components/marketplace/filters/AccordionFilters";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";
import {
  getPublicMemberById,
  getStorefrontListingsByMember,
} from "@/app/lib/mock-public-members";
import { useTradeStore } from "@/store/useTradeStore";
import type { SortKey } from "@/store/useMarketStore";

interface PageProps {
  params: Promise<{ id: string }>;
}

function matchesCondition(
  condition: "美品 S" | "微傷 A" | "傷 B",
  listing: ReturnType<typeof getStorefrontListingsByMember>[number],
) {
  if (listing.conditionLabel) {
    return listing.conditionLabel === condition;
  }

  if (condition === "美品 S") {
    return listing.grade.score === "10" || listing.grade.score === "9.5";
  }

  if (condition === "微傷 A") {
    return listing.grade.score === "9" || listing.grade.score === "NM";
  }

  return listing.grade.score === "8" || listing.grade.score === "EX";
}

export default function MerchantStorefrontPage({ params }: PageProps) {
  const { id } = use(params);
  const vendor = getPublicMemberById(id);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const setIsChatOpen = useTradeStore((state) => state.setIsChatOpen);
  const setActiveRoomId = useTradeStore((state) => state.setActiveRoomId);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("最新");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeRarities, setActiveRarities] = useState<string[]>([]);
  const [activeGrades, setActiveGrades] = useState<string[]>([]);
  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const storefrontListings = useMemo(
    () => (vendor ? getStorefrontListingsByMember(vendor) : []),
    [vendor],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredListings = useMemo(() => {
    return storefrontListings
      .filter((listing) => {
        const searchableCardNo = (listing.cardNo ?? listing.id).toLowerCase();
        const normalizedQuery = query.trim().toLowerCase();

        const matchQuery =
          normalizedQuery.length === 0 ||
          listing.name.toLowerCase().includes(normalizedQuery) ||
          searchableCardNo.includes(normalizedQuery);

        const matchRarity =
          activeRarities.length === 0 ||
          activeRarities.includes(listing.rarity);

        const isGradedCard = listing.grade.authority !== "Raw Card";
        const matchGrade =
          activeGrades.length === 0 ||
          activeGrades.some((grade) => {
            if (grade === "Raw Card") return !isGradedCard;

            const [authority, score] = grade.split(" ");
            return (
              listing.grade.authority === authority &&
              listing.grade.score === score
            );
          });

        const matchCondition =
          activeConditions.length === 0 ||
          activeConditions.some((condition) =>
            matchesCondition(
              condition as "美品 S" | "微傷 A" | "傷 B",
              listing,
            ),
          );

        return matchQuery && matchRarity && matchGrade && matchCondition;
      })
      .sort((a, b) => {
        if (sortKey === "價格：由低到高") return a.price - b.price;
        if (sortKey === "價格：由高到低") return b.price - a.price;
        return 0;
      });
  }, [
    storefrontListings,
    query,
    activeRarities,
    activeGrades,
    activeConditions,
    sortKey,
  ]);

  const toggleFilterValue = (
    value: string,
    setState: Dispatch<SetStateAction<string[]>>,
  ) => {
    setState((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#17130f] py-20">
        <h1 className="text-xl font-sans font-bold text-text-disabled">
          未找到該商戶的市集櫥窗
        </h1>
        <Link
          href="/marketplace"
          className="text-brand text-sm mt-3 hover:underline"
        >
          ← 返回全網大盤
        </Link>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-6 pb-28 lg:pb-12 animate-fadeIn">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-6">
        <section className="flex-1 rounded-2xl border border-[rgba(212,165,116,0.18)] bg-[#26211C] p-5 lg:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-sans font-black text-[24px] lg:text-[28px] text-[#eae1da] tracking-tight">
                  {vendor.username}
                </h1>
                <span className="font-mono text-[10px] bg-brand/10 text-brand px-2.5 py-1 rounded-full border border-brand/20 uppercase tracking-[0.18em] font-bold">
                  🏅 {vendor.level}
                </span>
                {vendor.verifiedBuyer ? (
                  <span className="font-mono text-[10px] bg-[#17130f] text-[#d4c4b7] px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-[0.16em] font-bold">
                    已驗證交易身份
                  </span>
                ) : null}
              </div>

              <p className="font-mono text-[11.5px] text-[#d4c4b7] leading-relaxed">
                {vendor.handle} · {vendor.joinDate} · 累計完成{" "}
                {vendor.completedTrades.toLocaleString()} 筆託管交割 · 目前公開{" "}
                {storefrontListings.length} 件私域現貨標的
              </p>

              <p className="max-w-[760px] font-sans text-[13.5px] text-[#d4c4b7] leading-relaxed">
                {vendor.bio}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {vendor.badges.map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.desc}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/6 bg-[#17130f] px-3 py-1.5"
                  >
                    <span className="text-[13px]">{badge.emoji}</span>
                    <span className="font-mono text-[10.5px] text-[#d4c4b7]">
                      {badge.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row xl:flex-col items-stretch sm:items-end xl:items-end gap-3 shrink-0">
              <div className="grid grid-cols-2 gap-2 min-w-[220px]">
                <div className="rounded-xl border border-white/6 bg-[#17130f] px-3 py-2.5 text-right">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#50453b]">
                    評級
                  </p>
                  <p className="font-mono text-[18px] font-black text-[#eae1da]">
                    {vendor.rating.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/6 bg-[#17130f] px-3 py-2.5 text-right">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#50453b]">
                    評價數
                  </p>
                  <p className="font-mono text-[18px] font-black text-[#eae1da]">
                    {vendor.reviewCount}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveRoomId(vendor.id);
                  setIsChatOpen(true);
                }}
                className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12.5px] rounded-xl hover:bg-[#e8b896] transition-colors cursor-pointer shadow-md"
              >
                💬 發起私域議價
              </button>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-2 self-end xl:self-start">
          <span className="font-mono text-[10px] text-[#50453b] uppercase tracking-wider font-bold">
            排序
          </span>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="h-9 px-3 bg-[#26211C] text-[#eae1da] border border-white/5 rounded-[8px] font-sans text-[12px] focus:outline-none cursor-pointer"
          >
            <option value="最新">上架時間：最新</option>
            <option value="價格：由低到高">價格：由低到高</option>
            <option value="價格：由高到低">價格：由高到低</option>
          </select>
        </div>
      </div>

      <div ref={searchContainerRef} className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d4c4b7"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="search"
          value={query}
          onFocus={() => setIsSearchFocused(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsSearchFocused(true);
          }}
          placeholder="搜尋官方卡牌名稱、編號、稀有度..."
          className="w-full h-12 pl-11 pr-4 bg-[#26211C] border border-white/5 rounded-[10px] text-[13.5px] text-[#eae1da] focus:outline-none"
        />
        <SmartSearch
          query={query}
          listings={storefrontListings}
          isOpen={isSearchFocused}
          onSelect={(name) => {
            setQuery(name);
            setIsSearchFocused(false);
          }}
        />
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 items-start">
        <aside className="hidden lg:block lg:sticky lg:top-[5.5rem] max-h-[calc(100vh-8rem)] overflow-y-auto space-y-4 scrollbar-none">
          <AccordionFilters
            activeRarities={activeRarities}
            onRarityToggle={(rarity) =>
              toggleFilterValue(rarity, setActiveRarities)
            }
            activeGrades={activeGrades}
            onGradeToggle={(grade) => toggleFilterValue(grade, setActiveGrades)}
            activeConditions={activeConditions}
            onConditionToggle={(condition) =>
              toggleFilterValue(condition, setActiveConditions)
            }
          />
        </aside>

        <div className="flex-1">
          {filteredListings.length === 0 ? (
            <div className="py-20 text-center bg-[#26211C] border border-dashed border-white/5 rounded-2xl font-sans text-[13.5px] text-text-disabled">
              此商戶私域櫥窗暫時沒有符合篩選條件的商品
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredListings.map((listing) => (
                <MarketplaceCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

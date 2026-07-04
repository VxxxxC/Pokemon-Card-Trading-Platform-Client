"use client";

import { useEffect, useState } from "react";
import { Accordion } from "@/app/components/ui/Accordion";
import { getMarketplaceRarities } from "@/app/actions/marketplace";
import {
  GRADING_OPTION_GROUPS,
  getGradingOptionsByGroup,
} from "@/lib/grading/options";
import { MARKETPLACE_SELLER_SOURCE_OPTIONS } from "@/lib/marketplace/filter-options";

interface AccordionFiltersProps {
  activeRarities: string[];
  onRarityToggle: (rarity: string) => void;
  activeGrades: string[];
  onGradeToggle: (grade: string) => void;
  activeTypes?: string[];
  onTypeToggle?: (type: string) => void;
  hideTypeSection?: boolean;
  /** Optional override; defaults to distinct `product_catalog.rarity` values. */
  rarities?: string[];
  /** When true, parent supplies rarities — skip internal fetch. */
  disableRarityFetch?: boolean;
}

export function AccordionFilters({
  activeRarities,
  onRarityToggle,
  activeGrades,
  onGradeToggle,
  activeTypes = [],
  onTypeToggle,
  hideTypeSection = false,
  rarities: raritiesProp,
  disableRarityFetch = false,
}: AccordionFiltersProps) {
  const [openSections, setOpenSections] = useState({
    rarity: true,
    grade: true,
    type: true,
  });
  const [catalogRarities, setCatalogRarities] = useState<string[]>([]);
  const [raritiesLoading, setRaritiesLoading] = useState(
    !raritiesProp && !disableRarityFetch,
  );

  useEffect(() => {
    if (raritiesProp || disableRarityFetch) return;

    let cancelled = false;

    void (async () => {
      setRaritiesLoading(true);
      const result = await getMarketplaceRarities();
      if (cancelled) return;

      if (result.success) {
        setCatalogRarities(result.data);
      }
      setRaritiesLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [raritiesProp, disableRarityFetch]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const rarities = raritiesProp ?? catalogRarities;

  return (
    <div className="space-y-1 bg-[#26211C] p-4 rounded-2xl border border-[rgba(237,232,224,0.08)]">
      {!hideTypeSection && (
        <Accordion
          title="刊登來源"
          isOpen={openSections.type}
          onToggle={() => toggleSection("type")}
        >
          <div className="space-y-2">
            {MARKETPLACE_SELLER_SOURCE_OPTIONS.map(({ key, label }) => {
              const isActive = activeTypes.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onTypeToggle?.(key)}
                  className="flex items-center gap-2.5 w-full text-left py-1 group/item"
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      isActive
                        ? "bg-[#d4a574] border-[#d4a574]"
                        : "border-[rgba(237,232,224,0.20)] group-hover/item:border-[#d4a574]/50"
                    }`}
                  >
                    {isActive && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#1A1612"
                        strokeWidth="3.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`font-sans text-[13px] transition-colors ${
                      isActive
                        ? "text-[#eae1da] font-medium"
                        : "text-[#d4c4b7] group-hover/item:text-[#eae1da]"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </Accordion>
      )}

      <Accordion
        title="稀有度"
        isOpen={openSections.rarity}
        onToggle={() => toggleSection("rarity")}
      >
        {raritiesLoading ? (
          <p className="font-mono text-[11px] text-[#8A8680]">載入稀有度選項…</p>
        ) : rarities.length === 0 ? (
          <p className="font-mono text-[11px] text-[#8A8680]">暫無稀有度資料</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {rarities.map((rarity) => {
              const isActive = activeRarities.includes(rarity);
              return (
                <button
                  key={rarity}
                  type="button"
                  onClick={() => onRarityToggle(rarity)}
                  className={`h-7 px-3 rounded-[6px] font-mono text-[11px] font-medium border transition-all active:scale-95 ${
                    isActive
                      ? "bg-[rgba(212,165,116,0.15)] text-[#d4a574] border-[#d4a574]/40"
                      : "bg-[#17130f] text-[#d4c4b7] border-[rgba(237,232,224,0.08)] hover:border-[rgba(212,165,116,0.20)]"
                  }`}
                >
                  {rarity}
                </button>
              );
            })}
          </div>
        )}
      </Accordion>

      <Accordion
        title="鑑定／品相"
        isOpen={openSections.grade}
        onToggle={() => toggleSection("grade")}
      >
        <div className="max-h-72 overflow-y-auto space-y-4 pr-1 scrollbar-none">
          {GRADING_OPTION_GROUPS.map((group) => (
            <div key={group.key}>
              <p className="font-mono text-[10px] text-[#8A8680] uppercase tracking-wider mb-2">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {getGradingOptionsByGroup(group.key).map((option) => {
                  const isActive = activeGrades.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onGradeToggle(option.id)}
                      className="flex items-center gap-2.5 w-full text-left py-1 group/item"
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                          isActive
                            ? "bg-[#d4a574] border-[#d4a574]"
                            : "border-[rgba(237,232,224,0.20)] group-hover/item:border-[#d4a574]/50"
                        }`}
                      >
                        {isActive && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#1A1612"
                            strokeWidth="3.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`font-mono text-[12px] transition-colors ${
                          isActive
                            ? "text-[#eae1da] font-medium"
                            : "text-[#d4c4b7] group-hover/item:text-[#eae1da]"
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Accordion>
    </div>
  );
}

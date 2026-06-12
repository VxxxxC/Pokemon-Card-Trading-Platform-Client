"use client";

import { useState } from "react";
import { Accordion } from "@/app/components/ui/Accordion";

interface AccordionFiltersProps {
  activeRarities: string[];
  onRarityToggle: (rarity: string) => void;
  activeGrades: string[];
  onGradeToggle: (grade: string) => void;
  activeConditions: string[];
  onConditionToggle: (condition: string) => void;
  // 🟢 調整為可選屬性：如果 hideTypeSection 爲 true，這裏連引流都不用傳
  activeTypes?: string[];
  onTypeToggle?: (type: string) => void;
  // 🟢 核心戰術指針：加入物理隔離控制開關
  hideTypeSection?: boolean;
}

export function AccordionFilters({
  activeRarities,
  onRarityToggle,
  activeGrades,
  onGradeToggle,
  activeConditions,
  onConditionToggle,
  activeTypes = [],
  onTypeToggle,
  hideTypeSection = false, // 預設不隱藏
}: AccordionFiltersProps) {
  const [openSections, setOpenSections] = useState({
    rarity: true,
    condition: true,
    grade: true,
    type: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const rarities = ["SAR", "UR", "SR", "AR"];
  const conditions = [
    { key: "美品 S", label: "【美品 S】" },
    { key: "微傷 A", label: "【微傷 A】" },
    { key: "傷 B", label: "【傷 B】" },
  ];
  const grades = ["Raw Card", "PSA 10", "BGS 9.5", "CGC 9"];

  const listingTypes = [
    { key: "MERCHANT", label: "🏪 商戶特約現貨" },
    { key: "C2C", label: "🏛️ C2C 玩家市集" },
    { key: "P2P", label: "⚡ P2P 擔保交易" },
  ];

  return (
    <div className="space-y-1 bg-[#26211C] p-4 rounded-2xl border border-[rgba(237,232,224,0.08)]">
      {/* 🟢 核心修正：底層物理防線。一旦開關啟動，這段代碼直接原地蒸發，絕不佔用任何渲染和內存效能 */}
      {!hideTypeSection && (
        <Accordion
          title="刊登來源與模式"
          isOpen={openSections.type}
          onToggle={() => toggleSection("type")}
        >
          <div className="space-y-2">
            {listingTypes.map(({ key, label }) => {
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

      {/* Rarity Section */}
      <Accordion
        title="日版特有稀有度"
        isOpen={openSections.rarity}
        onToggle={() => toggleSection("rarity")}
      >
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
      </Accordion>

      {/* Condition Section */}
      <Accordion
        title="香港玩家品相分級"
        isOpen={openSections.condition}
        onToggle={() => toggleSection("condition")}
      >
        <div className="space-y-2">
          {conditions.map(({ key, label }) => {
            const isActive = activeConditions.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onConditionToggle(key)}
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

      {/* Grader Authority Section */}
      <Accordion
        title="封裝鑑定規格"
        isOpen={openSections.grade}
        onToggle={() => toggleSection("grade")}
      >
        <div className="space-y-2">
          {grades.map((grade) => {
            const isActive = activeGrades.includes(grade);
            return (
              <button
                key={grade}
                type="button"
                onClick={() => onGradeToggle(grade)}
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
                  className={`font-mono text-[13px] transition-colors ${
                    isActive
                      ? "text-[#eae1da] font-medium"
                      : "text-[#d4c4b7] group-hover/item:text-[#eae1da]"
                  }`}
                >
                  {grade}
                </span>
              </button>
            );
          })}
        </div>
      </Accordion>
    </div>
  );
}

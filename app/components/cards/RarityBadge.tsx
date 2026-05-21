type Rarity = "SAR" | "UR" | "SR" | "AR";

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className="inline-flex items-center font-mono text-[12px] font-medium text-[#202124] bg-white rounded-[4px] px-2 py-0.5 shrink-0"
      style={{
        border: "1px solid rgba(226, 232, 240, 0.6)",
        borderLeft: "3px solid #2563EB",
      }}
    >
      {rarity}
    </span>
  );
}

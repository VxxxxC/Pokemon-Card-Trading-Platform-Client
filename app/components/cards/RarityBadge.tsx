type ProductCatalogRarity = string | null;

export function RarityBadge({ rarity }: { rarity: ProductCatalogRarity }) {
  if (!rarity) return null;

  return (
    <span
      className="inline-flex items-center font-mono text-[12px] font-medium text-brand bg-bg-elevated rounded-[4px] px-2 py-0.5 shrink-0"
      style={{
        border: "1px solid rgba(237,232,224,0.08)",
        borderLeft: "3px solid #d4a574",
      }}
    >
      {rarity}
    </span>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import type { AdminCatalogEntry } from "@/app/actions/adminCatalog";

interface CatalogCardProps {
  entry: AdminCatalogEntry;
  onImageClick: (entry: AdminCatalogEntry) => void;
  imagePriority?: boolean;
}

function resolveDisplayName(entry: AdminCatalogEntry): string {
  return entry.nameZh?.trim() || entry.nameEn?.trim() || entry.nameJa || "未命名卡牌";
}

function resolveIdentifier(entry: AdminCatalogEntry): string {
  const setCode = entry.setCode.toUpperCase();
  const card = entry.cardNumber?.trim() || entry.displayId?.trim() || "—";
  return `${setCode} · ${card}`;
}

function hasDisplayableRarity(
  rarity: AdminCatalogEntry["rarity"],
): rarity is NonNullable<AdminCatalogEntry["rarity"]> {
  if (!rarity) return false;
  const trimmed = rarity.trim();
  return trimmed !== "" && trimmed !== "-";
}

export function CatalogCard({
  entry,
  onImageClick,
  imagePriority = false,
}: CatalogCardProps) {
  const displayName = resolveDisplayName(entry);
  const showSubName = displayName !== entry.nameJa;
  const identifier = resolveIdentifier(entry);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group bg-bg-card rounded-2xl overflow-hidden border border-[rgba(237,232,224,0.08)] shadow-[0_2px_8px_rgba(0,0,0,0.40)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.65)] flex flex-col justify-between"
    >
      <button
        type="button"
        onClick={() => onImageClick(entry)}
        className="relative w-full aspect-[3/4] overflow-hidden rounded-t-2xl bg-[#1A1612] block text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        aria-label={`放大檢視 ${displayName}`}
      >
        <Image
          src={entry.imageUrl}
          alt={
            hasDisplayableRarity(entry.rarity)
              ? `${displayName} — ${entry.rarity}`
              : displayName
          }
          fill
          className="object-contain group-hover:scale-[1.03] transition-transform duration-300 p-2 rounded-2xl"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={imagePriority}
          loading={imagePriority ? undefined : "lazy"}
        />

        <div className="absolute inset-0 bg-linear-to-tr from-transparent via-[rgba(212,165,116,0.08)] to-[rgba(255,255,255,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_20%,rgba(255,255,255,0.15)_40%,rgba(255,255,255,0)_60%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

        {hasDisplayableRarity(entry.rarity) ? (
          <div className="absolute top-3 left-3 pointer-events-none">
            <RarityBadge rarity={entry.rarity} />
          </div>
        ) : null}
      </button>

      <div className="p-4 space-y-2.5">
        <div className="min-w-0">
          <h3 className="font-sans font-semibold text-[14.5px] text-text-primary leading-snug truncate group-hover:text-brand transition-colors">
            {displayName}
          </h3>
          {showSubName && (
            <p className="font-sans text-[11px] text-text-secondary truncate mt-0.5">
              {entry.nameJa}
            </p>
          )}
          <p className="font-mono text-[11px] text-text-secondary block truncate mt-1">
            {identifier}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 min-w-0">
          {hasDisplayableRarity(entry.rarity) ? (
            <span className="font-mono text-[11px] text-text-secondary truncate">
              {entry.rarity}
            </span>
          ) : (
            <span className="font-mono text-[11px] text-text-disabled truncate">
              未標示罕有度
            </span>
          )}
          {entry.janCode ? (
            <span className="font-mono text-[10px] text-text-disabled truncate">
              JAN {entry.janCode}
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

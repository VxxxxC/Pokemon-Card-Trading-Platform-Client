"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { WishlistEntry } from "@/app/lib/wishlist/types";
import { Pagination } from "@/app/components/ui/Pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GRADING_OPTIONS } from "@/lib/grading/options";
import type { GradingOption } from "@/lib/grading/options";
import { gradingOptionIdFromWishlistRow } from "@/lib/wishlist/grading";

const ITEMS_PER_PAGE = 5;

const RARITY_STYLE: Record<string, string> = {
  SAR: "text-brand border-[#8c7355]/40 bg-[rgba(212,165,116,0.08)]",
  UR: "text-[#e8b896] border-[#e8b896]/30 bg-[rgba(232,184,150,0.08)]",
  SR: "text-[#a8b4c0] border-[#a8b4c0]/30 bg-[rgba(168,180,192,0.08)]",
  AR: "text-[#7ec8a0] border-[#7ec8a0]/30 bg-[rgba(126,200,160,0.08)]",
  CSR: "text-[#c084fc] border-[#c084fc]/30 bg-[rgba(192,132,252,0.08)]",
};

function formatHkd(value: number | null): string {
  if (value == null) return "—";
  return `HK$ ${value.toLocaleString("en-HK")}`;
}

function wishlistRowKey(entry: WishlistEntry): string {
  return `${entry.productId}::${entry.gradingCompany}::${entry.gradingScore}`;
}

import {
  getSparklinePoints,
  hasWishlistTrendData,
} from "@/lib/wishlist/sparkline";

function MiniSparkline({
  points,
  direction,
  hasData,
}: {
  points: string;
  direction: "up" | "down";
  hasData: boolean;
}) {
  if (!hasData) {
    return (
      <span className="font-mono text-[10px] text-text-disabled">—</span>
    );
  }

  const color = direction === "up" ? "#10b981" : "#ef4444";
  return (
    <svg
      width="60"
      height="24"
      viewBox="0 0 60 24"
      fill="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WishlistThumbnail({
  entry,
  productHref,
}: {
  entry: WishlistEntry;
  productHref: string;
}) {
  const imageUrl = entry.imageUrl?.trim();

  return (
    <Link
      href={productHref}
      className="relative w-9 h-12 rounded-sm bg-bg-elevated border border-[rgba(237,232,224,0.08)] shrink-0 overflow-hidden block"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="36px"
          className="object-cover object-top"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] text-text-disabled">
          {entry.rarity ?? "—"}
        </span>
      )}
    </Link>
  );
}

function TargetPriceCell({
  entry,
  onSave,
}: {
  entry: WishlistEntry;
  onSave?: (entry: WishlistEntry, targetPrice: number | null) => Promise<boolean>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = () => {
    setDraft(
      entry.targetPrice != null && entry.targetPrice > 0
        ? String(entry.targetPrice)
        : "",
    );
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft("");
  };

  const commitEdit = async () => {
    if (!onSave) {
      cancelEdit();
      return;
    }

    const trimmed = draft.trim();
    const parsed =
      trimmed.length === 0 ? null : Number.parseFloat(trimmed.replace(/,/g, ""));

    if (trimmed.length > 0 && (!Number.isFinite(parsed) || (parsed ?? 0) < 0)) {
      return;
    }

    setIsSaving(true);
    try {
      const ok = await onSave(entry, parsed);
      if (ok) {
        setIsEditing(false);
        setDraft("");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void commitEdit();
            if (event.key === "Escape") cancelEdit();
          }}
          disabled={isSaving}
          placeholder="HK$"
          aria-label={`編輯 ${entry.name} 目標價`}
          className="w-24 rounded border border-[rgba(237,232,224,0.15)] bg-[#17130f] px-2 py-1 text-right font-mono text-[12px] text-text-primary"
        />
        <button
          type="button"
          onClick={() => void commitEdit()}
          disabled={isSaving}
          className="font-mono text-[10px] text-brand hover:text-brand-hover"
        >
          儲存
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <p className="font-mono text-[13px] text-text-secondary">
        {formatHkd(entry.targetPrice)}
      </p>
      {onSave ? (
        <button
          type="button"
          onClick={startEdit}
          aria-label={`編輯 ${entry.name} 目標價`}
          className="inline-flex w-6 h-6 items-center justify-center rounded text-text-disabled hover:text-brand hover:bg-bg-elevated/80 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path d="m2.695 14.762-1.262 3.34a.5.5 0 0 0 .65.65l3.34-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

function GradeCell({
  entry,
  onGradeChange,
}: {
  entry: WishlistEntry;
  onGradeChange?: (entry: WishlistEntry, option: GradingOption) => Promise<boolean>;
}) {
  const selectedId = gradingOptionIdFromWishlistRow(
    entry.gradingCompany,
    entry.gradingScore,
  );

  if (!onGradeChange) {
    return (
      <span className="inline-block font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border text-text-secondary border-[rgba(237,232,224,0.12)] bg-bg-elevated/40">
        {entry.gradeLabel}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border text-text-secondary border-[rgba(237,232,224,0.12)] bg-bg-elevated/40 hover:border-brand/40 hover:text-brand transition-colors cursor-pointer focus:outline-none"
        aria-label={`更改 ${entry.name} 追蹤規格`}
      >
        {entry.gradeLabel}
        <span className="text-[9px] opacity-70" aria-hidden="true">
          ▾
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="max-h-64 overflow-y-auto min-w-44"
      >
        {GRADING_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.id}
            disabled={option.id === selectedId}
            onClick={() => void onGradeChange(entry, option)}
            className="font-mono text-[11px]"
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { WishlistEntry };

interface WishlistTableProps {
  entries: WishlistEntry[];
  isLoading?: boolean;
  onRemove?: (entry: WishlistEntry) => void | Promise<void>;
  onUpdateTarget?: (
    entry: WishlistEntry,
    targetPrice: number | null,
  ) => Promise<boolean>;
  onUpdateGrade?: (
    entry: WishlistEntry,
    option: GradingOption,
  ) => Promise<boolean>;
}

export function WishlistTable({
  entries,
  isLoading = false,
  onRemove,
  onUpdateTarget,
  onUpdateGrade,
}: WishlistTableProps) {
  const router = useRouter();
  const [wishPage, setWishPage] = useState(1);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const totalWishPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
  const safePage =
    entries.length === 0 ? 1 : Math.min(wishPage, totalWishPages);
  const paginatedWishlist = entries.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handleRemove = async (entry: WishlistEntry) => {
    if (!onRemove) return;
    const key = wishlistRowKey(entry);
    setRemovingKey(key);
    try {
      await onRemove(entry);
    } finally {
      setRemovingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="font-sans text-[15px] text-text-secondary">
          載入願望清單中…
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-[40px]" aria-hidden="true">
          ☆
        </span>
        <p className="font-sans text-[15px] text-text-secondary">
          願望清單為空
        </p>
        <Link
          href="/marketplace"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          瀏覽市場 →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto -mx-4 lg:mx-0">
        <table className="w-full min-w-160 border-collapse">
          <thead>
            <tr className="border-b border-[rgba(237,232,224,0.08)]">
              {(
                [
                  {
                    label: "卡牧資料",
                    align: "text-left",
                    extra: "pl-4 lg:pl-0",
                  },
                  {
                    label: "規格",
                    align: "text-center text-nowrap",
                    extra: "px-3",
                  },
                  {
                    label: "稀有度",
                    align: "text-center text-nowrap",
                    extra: "px-3",
                  },
                  { label: "平台現價", align: "text-right", extra: "px-3" },
                  { label: "目標價", align: "text-right", extra: "px-3" },
                  {
                    label: "30D 走勢",
                    sublabel: "SNKRDUNK 參考",
                    align: "text-center",
                    extra: "px-3",
                  },
                  {
                    label: "操作",
                    align: "text-right",
                    extra: "pr-4 lg:pr-0",
                  },
                ] as const
              ).map((column) => (
                <th
                  key={column.label}
                  className={`font-mono text-[11px] text-text-disabled uppercase tracking-wider pb-3 ${column.align} ${column.extra}`}
                >
                  <span className="block">{column.label}</span>
                  {"sublabel" in column && column.sublabel ? (
                    <span className="block text-[9px] normal-case tracking-normal text-text-disabled/70 mt-0.5">
                      {column.sublabel}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedWishlist.map((entry) => {
              const rowKey = wishlistRowKey(entry);
              const platformPrice = entry.lowestListingPrice;
              const trackedPrice = entry.trackedPrice;
              const hasTrend = hasWishlistTrendData(
                entry.trend30d,
                entry.chartPoints,
              );
              const sparklinePoints = getSparklinePoints(
                entry.chartPoints,
                60,
                24,
              );
              const sparklineDirection =
                entry.trend30d != null && entry.trend30d >= 0 ? "up" : "down";
              const diffFromTracked =
                platformPrice != null && trackedPrice != null
                  ? platformPrice - trackedPrice
                  : null;
              const diffSign = diffFromTracked != null && diffFromTracked >= 0 ? "+" : "";
              const trendSign =
                entry.trend30d != null && entry.trend30d >= 0 ? "▲" : "▼";
              const rarityKey = (entry.rarity ?? "SR").toUpperCase();
              const productHref = `/marketplace/product/${entry.productId}`;

              return (
                <tr
                  key={rowKey}
                  className="border-b border-[rgba(237,232,224,0.04)] hover:bg-bg-elevated/50 transition-colors"
                >
                  <td className="py-4 pl-4 lg:pl-0 pr-3">
                    <div className="flex items-center gap-3">
                      <WishlistThumbnail
                        entry={entry}
                        productHref={productHref}
                      />
                      <div className="min-w-0">
                        <Link
                          href={productHref}
                          className="font-sans font-semibold text-[13px] text-text-primary truncate hover:text-brand transition-colors duration-200 block w-full cursor-pointer"
                        >
                          {entry.name}
                        </Link>
                        <p className="font-mono text-[10px] text-text-disabled">
                          {entry.cardCode || entry.displayId || entry.productId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <GradeCell entry={entry} onGradeChange={onUpdateGrade} />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span
                      className={`inline-block font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        RARITY_STYLE[rarityKey] ?? RARITY_STYLE.SR
                      }`}
                    >
                      {entry.rarity ?? "—"}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <p className="font-mono font-semibold text-[14px] text-text-primary">
                      {formatHkd(platformPrice)}
                    </p>
                    {platformPrice == null ? (
                      <p className="font-mono text-[10px] text-text-disabled">
                        暫無放售
                      </p>
                    ) : diffFromTracked != null ? (
                      <p
                        className={`font-mono text-[10px] ${
                          diffFromTracked >= 0 ? "text-warning" : "text-success"
                        }`}
                      >
                        {diffSign}HK${" "}
                        {Math.abs(diffFromTracked).toLocaleString("en-HK")}{" "}
                        自追蹤
                      </p>
                    ) : null}
                  </td>
                  <td className="py-4 px-3 text-right">
                    <TargetPriceCell entry={entry} onSave={onUpdateTarget} />
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <MiniSparkline
                        points={sparklinePoints}
                        direction={sparklineDirection}
                        hasData={hasTrend}
                      />
                      {entry.trend30d != null ? (
                        <span
                          className={`font-mono text-[10px] ${
                            entry.trend30d >= 0 ? "text-success" : "text-warning"
                          }`}
                        >
                          {trendSign} {Math.abs(entry.trend30d).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-text-disabled">
                          —
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 pl-3 pr-4 lg:pr-0 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        disabled={removingKey === rowKey}
                        className="inline-flex w-8 h-8 items-center justify-center rounded-lg border border-transparent hover:bg-[#322a24] hover:border-[rgba(237,232,224,0.10)] text-[#d4c4b7] hover:text-[#eae1da] transition-all font-mono text-[15px] focus:outline-none cursor-pointer select-none disabled:opacity-50"
                        aria-label={`${entry.name} 更多操作`}
                      >
                        ⋯
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-44">
                        <DropdownMenuItem
                          onClick={() => router.push(productHref)}
                        >
                          查看商品頁
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={!onRemove}
                          onClick={() => void handleRemove(entry)}
                        >
                          從願望清單移除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={safePage}
        totalPages={totalWishPages}
        onPageChange={setWishPage}
        itemLabel="筆追蹤記錄"
        totalItems={entries.length}
        itemsPerPage={ITEMS_PER_PAGE}
        hideControls={false}
        enableScroll={true}
        scrollToViewId="wishlist-heading"
        scrollBlock="start"
      />
    </div>
  );
}

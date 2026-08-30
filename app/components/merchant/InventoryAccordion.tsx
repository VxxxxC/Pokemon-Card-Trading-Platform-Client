"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CiBullhorn } from "react-icons/ci";
import { Pencil } from "lucide-react";
import type { ListingStatus } from "@/app/lib/types/rbac";
import type { ListingImage } from "@/lib/listings/images";
import { Pagination } from "@/app/components/ui/Pagination";
import { ListingEditDialog } from "@/app/components/merchant/ListingEditDialog";

// ─── Data Contracts ────────────────────────────────────────────────────────────

export interface CardInstance {
  id: string;
  grade: string;
  grader: string;
  askPrice: number;
  status: ListingStatus;
  createdAt: string;
  conditionDesc: string;
  edgeWear: string;
  photos: number;
  images: ListingImage[];
  gradingOptionId: string;
  useAuthentication: boolean;
  views: number;
  offersCount?: number;
  isSealedListing?: boolean;
  extraShippingFee?: number;
}

export interface SKUGroup {
  id: string;
  cardName: string;
  cardNo: string;
  nameZh?: string | null;
  setCode?: string;
  cardNumber?: string;
  rarity?: string | null;
  thumbnailSeed: string;
  imageUrl?: string | null;
  items: CardInstance[];
}

export function formatSkuCatalogLine(
  sku: Pick<SKUGroup, "setCode" | "cardNumber" | "cardNo" | "rarity">,
): string {
  const rarity = sku.rarity?.trim();
  const hasRarity =
    rarity != null &&
    rarity.length > 0 &&
    rarity !== "—" &&
    rarity !== "-" &&
    rarity !== "–";

  return [
    sku.setCode?.trim(),
    sku.cardNumber?.trim() || sku.cardNo?.trim(),
    hasRarity ? rarity : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

// ─── Status Display Map ────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ListingStatus, { label: string; className: string }> = {
  active: {
    label: "上架中",
    className: "text-success bg-success/10 border border-success/20",
  },
  sold: {
    label: "已售出",
    className: "text-text-disabled bg-bg-elevated border border-[rgba(237,232,224,0.08)]",
  },
  draft: {
    label: "草稿",
    className: "text-warning bg-warning/10 border border-warning/20",
  },
  pending: {
    label: "審核中",
    className: "text-brand bg-brand/10 border border-brand/20",
  },
  inactive: {
    label: "未上架",
    className: "text-text-secondary bg-bg-page/80 border border-[rgba(237,232,224,0.12)]",
  },
};

function formatInventoryMobilePrice(value: number): string {
  return `$${value.toLocaleString("en-HK")}`;
}

// ─── Card Instance Row with Edit Dialog ────────────────────────────────────────

interface CardInstanceRowProps {
  sku: Pick<SKUGroup, "cardName" | "cardNo" | "setCode" | "cardNumber">;
  item: CardInstance;
  inventoryContext?: "merchant" | "member";
}

function CardInstanceRow({
  sku,
  item,
  inventoryContext = "member",
}: CardInstanceRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { label, className } = STATUS_LABEL[item.status];
  const canEdit = !item.isSealedListing;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (canEdit) setIsOpen(true);
        }}
        disabled={!canEdit}
        aria-label={
          canEdit
            ? `編輯掛單 上架序號 ${item.id}`
            : `盒組掛單 上架序號 ${item.id}`
        }
        className={`w-full flex flex-col gap-1 py-2 px-2.5 bg-bg-page/40 border border-[rgba(237,232,224,0.08)] rounded-lg transition-colors select-none group/row text-left ${
          canEdit
            ? "hover:bg-bg-elevated/40 cursor-pointer"
            : "opacity-80 cursor-not-allowed"
        }`}
      >
        <p className="font-mono text-[9px] text-text-disabled leading-tight break-all w-full">
          <span className="text-text-disabled/80">上架序號 </span>
          {item.id}
        </p>

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 flex-wrap min-w-0 flex-1">
            <span className="inline-flex items-center max-w-full font-mono text-[10px] text-text-secondary bg-bg-page/80 border border-[rgba(237,232,224,0.12)] px-1.5 py-0.5 rounded-md shrink-0">
              <span className="truncate">{item.grade}</span>
            </span>
            <span
              className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0 ${className}`}
            >
              {label}
            </span>
            {item.offersCount && item.offersCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-warning shrink-0">
                <CiBullhorn className="w-3 h-3 animate-pulse" aria-hidden />
                {item.offersCount} 次叫價
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono font-semibold text-[12px] text-text-primary tabular-nums">
              {formatInventoryMobilePrice(item.askPrice)}
            </span>
            {canEdit ? (
              <span
                className="flex items-center justify-center w-7 h-7 rounded-md border border-[rgba(237,232,224,0.12)] bg-bg-page/80 text-text-secondary group-hover/row:border-brand/35 group-hover/row:text-brand transition-colors shrink-0"
                aria-hidden="true"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
              </span>
            ) : (
              <span className="flex items-center justify-center px-2 h-7 font-sans text-[10px] font-medium text-text-secondary border border-[rgba(237,232,224,0.12)] bg-bg-page/80 rounded-md shrink-0">
                盒組
              </span>
            )}
          </div>
        </div>
      </button>

      {isOpen && canEdit ? (
        <ListingEditDialog
          open
          onOpenChange={setIsOpen}
          sku={sku}
          item={item}
          inventoryContext={inventoryContext}
        />
      ) : null}
    </>
  );
}

// ─── Sku Items List Module ───────────────────────────────────────────────────

interface SkuItemsListProps {
  sku: SKUGroup;
  inventoryContext?: "merchant" | "member";
}

function SkuItemsList({ sku, inventoryContext = "member" }: SkuItemsListProps) {
  const [itemPage, setItemPage] = useState(1);
  const itemsPerPage = 5;
  const totalItemPages = Math.ceil(sku.items.length / itemsPerPage);
  const paginatedItems = sku.items.slice(
    (itemPage - 1) * itemsPerPage,
    itemPage * itemsPerPage,
  );

  return (
    <div className="space-y-2">
      {paginatedItems.map((item) => (
        <CardInstanceRow
          key={item.id}
          sku={sku}
          item={item}
          inventoryContext={inventoryContext}
        />
      ))}

      <Pagination
        currentPage={itemPage}
        totalPages={totalItemPages}
        onPageChange={(page) => setItemPage(page)}
        itemLabel="張實物現貨"
        totalItems={sku.items.length}
        itemsPerPage={itemsPerPage}
        hideControls={true}
        enableScroll={false}
      />
    </div>
  );
}

// ─── Main SKU Inventory Accordion ─────────────────────────────────────────────

interface InventoryAccordionProps {
  analytics?: boolean;
  skuGroups: SKUGroup[];
  inventoryContext?: "merchant" | "member";
}

export function InventoryAccordion({
  skuGroups,
  analytics = true,
  inventoryContext = "member",
}: InventoryAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="divide-y divide-[rgba(237,232,224,0.06)]">
      {skuGroups.map((sku) => {
        const isOpen = openId === sku.id;
        const totalOffers = sku.items.reduce((acc, item) => acc + (item.offersCount || 0), 0);
        const hasActiveOffer = sku.items.some((item) => (item.offersCount || 0) > 0);
        const catalogLine = formatSkuCatalogLine(sku);

        return (
          <div key={sku.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : sku.id)}
              aria-expanded={isOpen}
              aria-controls={`sku-panel-${sku.id}`}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                isOpen ? "bg-bg-elevated/50" : "hover:bg-bg-elevated/40"
              }`}
            >
              <div className="relative w-12 h-[3.5rem] rounded-md overflow-hidden border border-[rgba(237,232,224,0.08)] shrink-0">
                <Image
                  src={
                    sku.imageUrl?.trim() ||
                    `https://picsum.photos/seed/${sku.thumbnailSeed}/112/160`
                  }
                  alt={`${sku.cardName} 縮圖`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                {hasActiveOffer && (
                  <div className="absolute top-1 right-1 z-10 w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center animate-bounce shadow-md" title="有買家叫價！">
                    <CiBullhorn className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-sans text-[13px] font-medium text-text-primary truncate">
                    {sku.cardName}
                  </p>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[rgba(212,165,116,0.10)] text-brand border border-brand/20 shrink-0">
                    {sku.items.length} 張
                  </span>
                  {totalOffers > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded text-warning bg-[rgba(239,68,68,0.10)] font-bold animate-pulse">
                      {totalOffers} 次叫價
                    </span>
                  )}
                </div>
                {(sku.nameZh || catalogLine) ? (
                  <div className="mt-0.5 space-y-0.5 min-w-0">
                    {sku.nameZh ? (
                      <p className="font-sans text-[11px] text-text-secondary truncate">
                        {sku.nameZh}
                      </p>
                    ) : null}
                    {catalogLine ? (
                      <p className="font-mono text-[11px] text-text-secondary truncate uppercase">
                        {catalogLine}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="text-right shrink-0 hidden sm:block">
                {sku.items.length > 0 && (
                  <>
                    <p className="font-mono font-semibold text-[13px] text-text-primary">
                      HK$ {Math.min(...sku.items.map((it) => it.askPrice)).toLocaleString()}
                      {sku.items.length > 1 && (
                        <span className="text-text-disabled text-[11px]"> 起</span>
                      )}
                    </p>
                    <p className="font-mono text-[10.5px] mt-0.5">
                      {sku.items.length > 1 ? (
                        <>
                          至 <span className="text-brand font-bold">HK$ {Math.max(...sku.items.map((it) => it.askPrice)).toLocaleString()}</span>
                        </>
                      ) : (
                        sku.items[0].grade
                      )}
                    </p>
                  </>
                )}
              </div>

              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a89888"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div
              id={`sku-panel-${sku.id}`}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="bg-[rgba(212,165,116,0.02)] border-t border-[rgba(212,165,116,0.08)] px-3 pt-2 pb-2 space-y-2">

                  <SkuItemsList sku={sku} inventoryContext={inventoryContext} />

                  {analytics ? 
                  <div className="pt-1 border-t border-[rgba(237,232,224,0.06)]">
                    <Link
                      href={`/profile/merchant/analytics?productId=${sku.id}`}
                      className="w-full flex items-center justify-center gap-2 h-10 bg-[rgba(212,165,116,0.07)] text-brand border border-brand/25 font-sans text-[13px] font-semibold rounded-xl hover:bg-[rgba(212,165,116,0.15)] active:scale-[0.98] transition-all"
                    >
                      📊 前往本卡牌進階商品分析
                    </Link>
                  </div>
                    : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ListingStatus } from "@/app/lib/types/rbac";

/**
 * 商品 SKU 核心真理模型 — 含 accordion 展開層深度檢視 metadata。
 * 其他衍生視圖請使用 Pick / Omit 自此模型抽取，嚴禁重複手寫 interface。
 */
export interface MerchantListing {
  id: string;
  cardName: string;
  cardNo: string;
  set: string;
  grade: string;
  grader: "PSA" | "BGS" | "CGC" | "RAW";
  askPrice: number;
  photos: number;
  views: number;
  status: ListingStatus;
  createdAt: string;
  /** 具體品相描述（展開層） */
  conditionDesc: string;
  /** 邊角磨損屬性（展開層） */
  edgeWear: string;
  /** 副圖縮圖 seed（展開層全解析度縮圖） */
  thumbnailSeeds: string[];
  /** 歷史瀏覽量追蹤（展開層） */
  viewTrail: { period: string; views: number }[];
}

const STATUS_LABEL: Record<ListingStatus, { label: string; className: string }> = {
  active:  { label: "上架中",  className: "text-success bg-[rgba(16,185,129,0.12)]" },
  sold:    { label: "已售出",  className: "text-text-secondary bg-bg-elevated" },
  draft:   { label: "草稿",    className: "text-warning bg-[rgba(239,68,68,0.10)]" },
  pending: { label: "審核中",  className: "text-brand bg-[rgba(212,165,116,0.12)]" },
};

interface InventoryAccordionProps {
  listings: MerchantListing[];
}

/**
 * SKU 群組 Accordion 容器系統 — 點擊行展開深度檢視面板，
 * 採用 grid-template-rows 過渡幀實現原生 Tailwind 彈性摺疊動畫（零外部依賴）。
 */
export function InventoryAccordion({ listings }: InventoryAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
      {listings.map((listing, i) => {
        const { label, className } = STATUS_LABEL[listing.status];
        const isOpen = openId === listing.id;
        const maxTrailViews = Math.max(
          ...listing.viewTrail.map((t) => t.views),
          1,
        );

        return (
          <div
            key={listing.id}
            className={i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}
          >
            {/* ── SKU Summary Row（點擊展開） ─────────────────────────── */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : listing.id)}
              aria-expanded={isOpen}
              aria-controls={`sku-panel-${listing.id}`}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${isOpen ? "bg-bg-elevated" : "hover:bg-bg-elevated"}`}
            >
              <div className="w-8 h-11 rounded-md bg-bg-elevated border border-[rgba(237,232,224,0.08)] shrink-0 flex items-center justify-center">
                <span className="font-mono text-[9px] text-text-disabled">
                  {listing.set.slice(0, 3).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-sans text-[13px] font-medium text-text-primary truncate">
                    {listing.cardName}
                  </p>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${className}`}>
                    {label}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-text-secondary">
                  {listing.cardNo} · {listing.grade} · {listing.photos} 張照片 · {listing.views} 次瀏覽
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-semibold text-[14px] text-text-primary">
                  ¥{listing.askPrice.toLocaleString("zh-TW")}
                </p>
                <p className="font-mono text-[10px] text-text-disabled">
                  {listing.createdAt}
                </p>
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
                className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-brand" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* ── Expandable Detail Context Panel ─────────────────────── */}
            <div
              id={`sku-panel-${listing.id}`}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 pt-1 space-y-3 bg-[rgba(212,165,116,0.03)] border-t border-[rgba(212,165,116,0.12)]">
                  {/* 品相 + 邊角磨損 metadata */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 pt-3">
                    <div className="px-3 py-2.5 bg-[#17130f] rounded-xl border border-white/5">
                      <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mb-1">
                        品相描述
                      </p>
                      <p className="font-sans text-[12.5px] text-text-primary leading-relaxed">
                        {listing.conditionDesc}
                      </p>
                    </div>
                    <div className="px-3 py-2.5 bg-[#17130f] rounded-xl border border-white/5">
                      <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mb-1">
                        邊角磨損屬性
                      </p>
                      <p className="font-sans text-[12.5px] text-text-primary leading-relaxed">
                        {listing.edgeWear}
                      </p>
                    </div>
                  </div>

                  {/* 全解析度副圖縮圖 */}
                  <div>
                    <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mb-1.5">
                      實物副圖（{listing.thumbnailSeeds.length} 張）
                    </p>
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                      {listing.thumbnailSeeds.map((seed) => (
                        <div
                          key={seed}
                          className="relative w-16 aspect-[3/4] rounded-lg overflow-hidden border border-[rgba(237,232,224,0.10)] shrink-0"
                        >
                          <Image
                            src={`https://picsum.photos/seed/${seed}/160/214`}
                            alt={`${listing.cardName} 實物副圖`}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 歷史瀏覽量追蹤 */}
                  {/* TODO: [database] viewTrail is mock — replace with Supabase query on `listing_view_events` aggregated per week WHERE listing_id = sku */}
                  <div>
                    <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mb-1.5">
                      歷史瀏覽量追蹤
                    </p>
                    <div className="space-y-1.5">
                      {listing.viewTrail.map(({ period, views }) => (
                        <div key={period} className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-text-secondary w-14 shrink-0">
                            {period}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-[rgba(212,165,116,0.35)] to-brand transition-[width] duration-500"
                              style={{ width: `${(views / maxTrailViews) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-text-primary w-10 text-right shrink-0">
                            {views}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SKU 操作列：編輯 + 商品分析引流 */}
                  <div className="flex gap-2 pt-1">
                    {/* TODO: [server] "編輯" has no handler — must open listing edit flow and UPDATE `listings` row */}
                    <button
                      type="button"
                      className="flex-1 h-10 font-sans text-[13px] font-medium text-text-secondary border border-[rgba(237,232,224,0.12)] rounded-xl hover:bg-bg-elevated hover:text-text-primary active:scale-[0.98] transition-all cursor-pointer"
                    >
                      編輯
                    </button>
                    <Link
                      href={`/profile/merchant/analytics?sku=${listing.id}`}
                      className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 bg-[rgba(212,165,116,0.10)] text-brand border border-brand/30 font-sans text-[13px] font-semibold rounded-xl hover:bg-[rgba(212,165,116,0.18)] active:scale-[0.98] transition-all"
                    >
                      📈 商品分析
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import type { ListingStatus } from "@/app/lib/types/rbac";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ─── Data Contracts ────────────────────────────────────────────────────────────

/**
 * 單一實物卡牌資產節點 — 隸屬於某 SKU 群組的物理實例。
 * 每張卡牌的鑑定狀態、定價、品相描述均獨立持有。
 */
export interface CardInstance {
  id: string;           // Unique physical asset ID, e.g. "LST-001-A"
  grade: string;        // e.g. "PSA 10", "Raw Card"
  grader: string;       // e.g. "PSA", "BGS", "RAW"
  askPrice: number;
  status: ListingStatus;
  createdAt: string;
  conditionDesc: string;
  edgeWear: string;
  photos: number;
  views: number;
}

/**
 * SKU 群組模型 — 代表同一張卡的所有物理實例集合。
 * 其他衍生視圖請使用 Pick / Omit 自此模型抽取，嚴禁重複手寫 interface。
 */
export interface SKUGroup {
  id: string;           // Unified SKU ID, e.g. "SKU-sv2a-182"
  cardName: string;
  cardNo: string;
  set: string;
  thumbnailSeed: string;
  items: CardInstance[];
}

/** @deprecated 舊式平面結構 — 已被 SKUGroup 取代，保留以供 NewListingForm 相容 */
export interface MerchantListing extends CardInstance {
  cardName: string;
  cardNo: string;
  set: string;
  thumbnailSeeds: string[];
  viewTrail: { period: string; views: number }[];
}

// ─── Status Display Map ────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ListingStatus, { label: string; className: string }> = {
  active:  { label: "上架中",  className: "text-success bg-[rgba(16,185,129,0.12)]" },
  sold:    { label: "已售出",  className: "text-text-secondary bg-bg-elevated" },
  draft:   { label: "草稿",    className: "text-warning bg-[rgba(239,68,68,0.10)]" },
  pending: { label: "審核中",  className: "text-brand bg-[rgba(212,165,116,0.12)]" },
};

/** 平台主題輸入框基準樣式（黑金量產規格，對齊 NewListingForm） */
const INPUT_BASE =
  "bg-[#17130f] border border-white/5 rounded-xl h-11 text-text-primary px-4 font-sans text-[14px] w-full focus:outline-none placeholder-text-disabled";

const TEXTAREA_BASE =
  "bg-[#17130f] border border-white/5 rounded-xl text-text-primary px-4 py-3 font-sans text-[13px] w-full focus:outline-none placeholder-text-disabled resize-none leading-relaxed";

const INPUT_GROUP_BASE =
  "flex items-center bg-[#17130f] border border-white/5 rounded-xl h-11 text-text-primary overflow-hidden";

// ─── Edit Dialog for a Single CardInstance ─────────────────────────────────────

interface EditCardInstanceDialogProps {
  sku: Pick<SKUGroup, "cardName" | "cardNo" | "set">;
  item: CardInstance;
}

/**
 * 單一實物卡牌修改彈窗 — 表單欄位完全鏡像 NewListingForm 的輸入架構。
 * 使用 React 19 原生 formAction 非受控模式，零 keystroke state churn。
 */
function EditCardInstanceDialog({ sku, item }: EditCardInstanceDialogProps) {
  // TODO [BACKEND]: Replace with server action — UPDATE `listings` SET ... WHERE id = item.id
  function handleSave(formData: FormData) {
    const price = formData.get("ask-price");
    toast.success(`「${sku.cardName} · ${item.grade}」修改已提交（待後端接通）`);
    void price; // consumed by server action in production
  }

  // TODO [BACKEND]: Replace with server action — UPDATE `listings` SET status='draft' WHERE id = item.id
  function handleSaveDraft(formData: FormData) {
    toast(`「${sku.cardName} · ${item.grade}」已暫存草稿（待後端接通）`);
    void formData;
  }

  return (
    <Dialog>
      <DialogTrigger
        className="px-4 h-9 font-sans text-[12.5px] font-medium text-text-secondary border border-[rgba(237,232,224,0.12)] rounded-xl hover:bg-bg-elevated hover:text-text-primary active:scale-[0.98] transition-all cursor-pointer"
      >
        編輯
      </DialogTrigger>

      <DialogContent
        className="!max-w-lg bg-[#1A1612] border border-[rgba(212,165,116,0.20)] text-text-primary overflow-y-auto max-h-[90dvh]"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="font-sans font-black text-[16px] text-text-primary tracking-tight">
            修改商品資訊
          </DialogTitle>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            {sku.cardNo} · {sku.cardName} · {item.grade}
          </p>
        </DialogHeader>

        <form action={handleSave} className="space-y-4 pt-2">
          {/* Row 1: 卡牌名稱（唯讀，僅展示） + 售價 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[12px] text-text-secondary block mb-1.5">
                卡牌編號
              </label>
              <input
                type="text"
                readOnly
                defaultValue={`${sku.cardNo} · ${sku.set}`}
                className={`${INPUT_BASE} opacity-50 cursor-not-allowed`}
              />
            </div>
            <div>
              <label
                htmlFor={`edit-price-${item.id}`}
                className="font-mono text-[12px] text-text-secondary block mb-1.5"
              >
                售價 (HK$) <span className="text-warning">*</span>
              </label>
              <div className={INPUT_GROUP_BASE}>
                <span className="px-3 font-mono text-[13px] text-text-disabled border-r border-white/5 shrink-0">
                  HK$
                </span>
                <input
                  id={`edit-price-${item.id}`}
                  name="ask-price"
                  type="number"
                  min={0}
                  required
                  defaultValue={item.askPrice}
                  className="flex-1 h-full bg-transparent px-3 font-mono text-[14px] text-text-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 2: 鑑定等級 + 品相備註 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={`edit-grade-${item.id}`}
                className="font-mono text-[12px] text-text-secondary block mb-1.5"
              >
                鑑定等級
              </label>
              <select
                id={`edit-grade-${item.id}`}
                name="card-grade"
                defaultValue={item.grade}
                className={`appearance-none cursor-pointer ${INPUT_BASE}`}
              >
                <option>PSA 10</option>
                <option>PSA 9</option>
                <option>PSA 8</option>
                <option>BGS 9.5</option>
                <option>BGS 9</option>
                <option>CGC 10</option>
                <option>CGC 9</option>
                <option>RAW NM</option>
                <option>RAW EX</option>
              </select>
            </div>
            <div>
              <label
                htmlFor={`edit-condition-${item.id}`}
                className="font-mono text-[12px] text-text-secondary block mb-1.5"
              >
                品相備註
              </label>
              <input
                id={`edit-condition-${item.id}`}
                name="condition-notes"
                type="text"
                defaultValue={item.conditionDesc}
                placeholder="例：角落完美，居中良好"
                className={INPUT_BASE}
              />
            </div>
          </div>

          {/* Row 3: 品相描述 Textarea */}
          <div>
            <label
              htmlFor={`edit-desc-${item.id}`}
              className="font-mono text-[12px] text-text-secondary block mb-1.5"
            >
              品相描述（詳細）
            </label>
            <textarea
              id={`edit-desc-${item.id}`}
              name="condition-desc"
              rows={3}
              defaultValue={item.conditionDesc}
              placeholder="詳細描述卡面狀況、印刷品質、鏡面完整度等..."
              className={TEXTAREA_BASE}
            />
          </div>

          {/* Row 4: 邊角磨損 Textarea */}
          <div>
            <label
              htmlFor={`edit-edge-${item.id}`}
              className="font-mono text-[12px] text-text-secondary block mb-1.5"
            >
              邊角磨損屬性
            </label>
            <textarea
              id={`edit-edge-${item.id}`}
              name="edge-wear"
              rows={2}
              defaultValue={item.edgeWear}
              placeholder="描述各角磨損、白邊情況、封殼狀態..."
              className={TEXTAREA_BASE}
            />
          </div>

          {/* Row 5: 照片槽位（裝飾性佔位，待 Supabase Storage 接通） */}
          {/* TODO [BACKEND]: Implement with supabase.storage.from('listing-photos').upload(`${item.id}/${i}`, file) */}
          <div>
            <p className="font-mono text-[12px] text-text-secondary block mb-1.5">
              實物照片 (必須 4–6 張) <span className="text-warning">*</span>
            </p>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    i < item.photos
                      ? "border-brand/40 bg-[rgba(212,165,116,0.06)]"
                      : "border-[rgba(237,232,224,0.12)] bg-[#17130f] hover:border-brand/30"
                  }`}
                >
                  {i < item.photos ? (
                    <span className="font-mono text-[9px] text-brand">✓</span>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#50453b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span className="font-mono text-[9px] text-text-disabled mt-0.5">
                        {i < 4 ? "必填" : "選填"}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              formAction={handleSaveDraft}
              formNoValidate
              className="flex-1 h-11 font-sans text-[14px] font-medium text-text-secondary border border-[rgba(237,232,224,0.12)] rounded-xl hover:bg-bg-elevated active:scale-[0.98] transition-all cursor-pointer"
            >
              儲存草稿
            </button>
            <button
              type="submit"
              className="flex-1 h-11 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-xl hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform cursor-pointer"
            >
              儲存修改
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main SKU Inventory Accordion ─────────────────────────────────────────────

interface InventoryAccordionProps {
  skuGroups: SKUGroup[];
}

/**
 * SKU 群組 Accordion 容器系統 — 每行代表一個卡牌型號，展開後列出其下所有物理實例。
 * 採用 grid-template-rows 過渡幀實現原生 Tailwind 彈性摺疊動畫（零外部依賴）。
 */
export function InventoryAccordion({ skuGroups }: InventoryAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
      {skuGroups.map((sku, i) => {
        const isOpen = openId === sku.id;
        const activeItems = sku.items.filter((item) => item.status === "active");

        return (
          <div
            key={sku.id}
            className={i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}
          >
            {/* ── SKU Summary Row（點擊展開） ─────────────────────────────── */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : sku.id)}
              aria-expanded={isOpen}
              aria-controls={`sku-panel-${sku.id}`}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                isOpen ? "bg-bg-elevated" : "hover:bg-bg-elevated"
              }`}
            >
              {/* SKU Thumbnail Seed */}
              <div className="relative w-8 h-11 rounded-md overflow-hidden border border-[rgba(237,232,224,0.08)] shrink-0">
                <Image
                  src={`https://picsum.photos/seed/${sku.thumbnailSeed}/64/88`}
                  alt={`${sku.cardName} 縮圖`}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>

              {/* SKU Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-sans text-[13px] font-medium text-text-primary truncate">
                    {sku.cardName}
                  </p>
                  {/* Stock count badge */}
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[rgba(212,165,116,0.10)] text-brand border border-brand/20 shrink-0">
                    共計 {sku.items.length} 張現貨
                  </span>
                  {activeItems.length > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded text-success bg-[rgba(16,185,129,0.12)]">
                      {activeItems.length} 上架中
                    </span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-text-secondary mt-0.5">
                  {sku.cardNo} · {sku.set}
                </p>
              </div>

              {/* Price range */}
              <div className="text-right shrink-0 hidden sm:block">
                {sku.items.length > 0 && (
                  <>
                    <p className="font-mono font-semibold text-[13px] text-text-primary">
                      HK$ {Math.min(...sku.items.map((it) => it.askPrice)).toLocaleString()}
                      {sku.items.length > 1 && (
                        <span className="text-text-disabled text-[11px]"> 起</span>
                      )}
                    </p>
                    <p className="font-mono text-[10px] text-text-disabled">
                      {sku.items.length > 1
                        ? `至 HK$ ${Math.max(...sku.items.map((it) => it.askPrice)).toLocaleString()}`
                        : sku.items[0].grade}
                    </p>
                  </>
                )}
              </div>

              {/* Chevron */}
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

            {/* ── Expandable SKU Body Panel ────────────────────────────────── */}
            <div
              id={`sku-panel-${sku.id}`}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="bg-[rgba(212,165,116,0.02)] border-t border-[rgba(212,165,116,0.10)] px-4 pt-4 pb-4 space-y-3">

                  {/* ── Individual CardInstance Stack ── */}
                  {sku.items.map((item) => {
                    const { label, className } = STATUS_LABEL[item.status];

                    return (
                      <div
                        key={item.id}
                        className="bg-[#17130f] rounded-xl border border-white/[0.06] p-4 space-y-3"
                      >
                        {/* Instance Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Grade badge */}
                              <span className="font-mono text-[11px] font-bold text-brand bg-brand/10 border border-brand/25 px-2 py-0.5 rounded">
                                {item.grade}
                              </span>
                              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${className}`}>
                                {label}
                              </span>
                              <span className="font-mono text-[10px] text-text-disabled">
                                #{item.id}
                              </span>
                            </div>
                            <p className="font-mono text-[11px] text-text-secondary mt-1">
                              {item.photos} 張實物照 · {item.views} 次瀏覽 · {item.createdAt}
                            </p>
                          </div>

                          {/* Price + Edit */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <p className="font-mono font-bold text-[16px] text-text-primary leading-none">
                                HK$ {item.askPrice.toLocaleString()}
                              </p>
                            </div>
                            <EditCardInstanceDialog sku={sku} item={item} />
                          </div>
                        </div>

                        {/* Condition & Edge Wear */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                          <div className="px-3 py-2.5 bg-bg-elevated rounded-lg border border-white/[0.04]">
                            <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mb-1">
                              品相描述
                            </p>
                            <p className="font-sans text-[12.5px] text-text-primary leading-relaxed">
                              {item.conditionDesc}
                            </p>
                          </div>
                          <div className="px-3 py-2.5 bg-bg-elevated rounded-lg border border-white/[0.04]">
                            <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mb-1">
                              邊角磨損屬性
                            </p>
                            <p className="font-sans text-[12.5px] text-text-primary leading-relaxed">
                              {item.edgeWear}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* ── Analytics Footer Anchor ── */}
                  <div className="pt-1 border-t border-[rgba(237,232,224,0.06)]">
                    <Link
                      href={`/profile/merchant/analytics?sku=${sku.cardNo}`}
                      className="w-full flex items-center justify-center gap-2 h-10 bg-[rgba(212,165,116,0.07)] text-brand border border-brand/25 font-sans text-[13px] font-semibold rounded-xl hover:bg-[rgba(212,165,116,0.15)] active:scale-[0.98] transition-all"
                    >
                      📊 前往本卡牌進階商品分析
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

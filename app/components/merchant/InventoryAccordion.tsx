"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { CiBullhorn } from "react-icons/ci";
import type { ListingStatus } from "@/app/lib/types/rbac";
import { Pagination } from "@/app/components/ui/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

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
  views: number;
  offersCount?: number;
}

export interface SKUGroup {
  id: string;
  cardName: string;
  cardNo: string;
  thumbnailSeed: string;
  items: CardInstance[];
}

// ─── Status Display Map ────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ListingStatus, { label: string; className: string }> = {
  active:  { label: "上架中",  className: "text-success bg-[rgba(16,185,129,0.12)]" },
  sold:    { label: "已售出",  className: "text-text-secondary bg-bg-elevated" },
  draft:   { label: "草稿",    className: "text-warning bg-[rgba(239,68,68,0.10)]" },
  pending: { label: "審核中",  className: "text-brand bg-[rgba(212,165,116,0.12)]" },
};

const REMARKS_PRESETS = [
  "卡牌正面全貌",
  "背面右上角帶微白點",
  "左下邊角銳利特寫",
  "封殼完美無裂紋",
  "隨照附帶備註",
  "微距視角細節"
];

// ─── Card Instance Row with Full-Scale Inspection Dialog ─────────────────────────

interface CardInstanceRowProps {
  sku: Pick<SKUGroup, "cardName" | "cardNo">;
  item: CardInstance;
}

function CardInstanceRow({ sku, item }: CardInstanceRowProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!api) return;

    const updateCarouselState = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };

    queueMicrotask(updateCarouselState);

    api.on("select", updateCarouselState);
    api.on("reInit", updateCarouselState);

    return () => {
      api.off("select", updateCarouselState);
      api.off("reInit", updateCarouselState);
    };
  }, [api]);

  const { label, className } = STATUS_LABEL[item.status];

  function handleSave(formData: FormData) {
    const price = formData.get("ask-price");
    toast.success(`「${sku.cardName} · ${item.grade}」修改已儲存（待後端接通）`);
    setIsOpen(false);
    void price;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        nativeButton={false}
        render={
          <div className="w-full flex items-center justify-between py-2.5 px-3 bg-[#17130f]/60 hover:bg-[#1a1612] border border-white/[0.03] rounded-xl transition-all cursor-pointer select-none group/row text-left" />
        }
      >
        {/* Left Info Column */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1 items-start">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] font-bold text-text-disabled tracking-wider block">
              #{item.id}
            </span>
            {item.offersCount && item.offersCount > 0 ? (
              <CiBullhorn className="w-4 h-4 text-warning animate-pulse shrink-0" title="有買家叫價！" />
            ) : null}
          </div>
          
          <span className="font-sans text-[14.5px] font-medium text-text-primary truncate w-full">
            {sku.cardName}
          </span>
          
          {/* 🟢 核心重構點 1：[上架中] 完美重組至 [PSA grade] 右手面（Web + Mobile 100% 同步橫排） */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="font-mono text-[10px] font-medium text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded shrink-0">
              {item.grade}
            </span>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${className}`}>
              {label}
            </span>
          </div>
        </div>

        {/* 🟢 核心重構點 2：右側動作艙升格為 flex-col 縱向排字，叫價次數完美貼合在價格/按鈕正下方 */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
          {/* 上排：售價 + 編輯掣 */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono font-semibold text-[15px] md:text-[16px] text-brand">
              HK$ {item.askPrice.toLocaleString()}
            </span>
            <span className="flex items-center justify-center px-3 h-7 font-sans text-[12px] font-medium text-[#17130f] bg-brand rounded-lg hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer shrink-0">
              編輯
            </span>
          </div>

          {/* 下排：叫價次數提示字眼（手機端完美流暢顯化） */}
          <span className="font-mono text-[11px] text-text-secondary tracking-tight">
            叫價次數：<span className={item.offersCount && item.offersCount > 0 ? "text-warning font-bold" : ""}>{item.offersCount || 0} 次</span>
          </span>
        </div>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[850px] w-full max-w-[calc(100%-2rem)] bg-[#1A1612] border border-[rgba(212,165,116,0.20)] text-text-primary overflow-y-auto max-h-[90dvh] p-5 sm:p-6"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="font-sans font-black text-[18px] text-text-primary tracking-tight">
            卡牌實物詳情與編輯
          </DialogTitle>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            #{item.id} · {sku.cardName} · {item.grade}
          </p>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-5 md:gap-6 mt-3 md:mt-4 items-start">
          
          {/* Left Carousel Viewport */}
          <div className="flex flex-col items-center select-none group w-full md:w-auto shrink-0 overflow-hidden">
            <div className="relative w-full aspect-[3/4] max-h-[45dvh] md:w-80 md:h-[420px] md:max-h-none md:aspect-none rounded-xl overflow-hidden bg-[#120f0c] border border-white/5 shrink-0 shadow-inner">
              <Carousel setApi={setApi} className="w-full h-full [&>div]:h-full" opts={{ loop: true }}>
                <CarouselContent className="-ml-0 h-full">
                  {Array.from({ length: Math.max(item.photos, 1) }, (_, photoIdx) => {
                    const currentRemark = current === photoIdx ? (REMARKS_PRESETS[photoIdx] ?? "") : "";
                    return (
                      <CarouselItem key={photoIdx} className="pl-0 relative w-full h-full overflow-hidden rounded-xl">
                        <Image
                          src={`https://picsum.photos/seed/${item.id}-p${photoIdx}/400/500`}
                          alt={`${sku.cardName} 實物照 ${photoIdx + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 320px"
                          className="scale-100 object-cover transition-transform duration-500 ease-in-out hover:scale-105"
                          unoptimized
                        />
                        {/* Center-Top Contextual Annotation HUD Overlay */}
                        {currentRemark && (
                          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-md bg-[#17130f]/75 backdrop-blur-xs border border-white/10 text-center pointer-events-none select-none max-w-[85%] animate-fadeIn">
                            <p className="font-sans text-[11px] font-medium text-brand tracking-wide truncate">
                              {currentRemark}
                            </p>
                          </div>
                        )}
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 left-2 bg-black/60 hover:bg-black/80 border-0 hidden md:flex" />
                <CarouselNext className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 right-2 bg-black/60 hover:bg-black/80 border-0 hidden md:flex" />
              </Carousel>
            </div>

            {/* Dots Indicator */}
            {count > 1 && (
              <div className="flex justify-center gap-1.5 py-2.5">
                {Array.from({ length: count }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`前往第 ${index + 1} 張照片`}
                    onClick={() => api?.scrollTo(index)}
                    className={
                      index === current
                        ? "bg-brand w-3.5 h-1.5 opacity-100 rounded-full transition-all duration-300"
                        : "bg-text-disabled w-1.5 h-1.5 opacity-30 hover:opacity-50 rounded-full transition-all duration-300"
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Form Container */}
          <form action={handleSave} className="flex-1 w-full space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-[#17130f] border border-white/5 rounded-xl px-3.5 py-2.5 flex flex-col">
                <label htmlFor={`edit-price-${item.id}`} className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1">
                  售價 (HK$) <span className="text-warning">*</span>
                </label>
                <div className="flex items-center mt-1">
                  <span className="font-mono text-[13px] text-text-disabled mr-1.5 shrink-0">HK$</span>
                  <input
                    id={`edit-price-${item.id}`}
                    name="ask-price"
                    type="number"
                    min={0}
                    required
                    defaultValue={item.askPrice}
                    className="w-full bg-transparent text-text-primary text-[14px] font-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#17130f] border border-white/5 rounded-xl px-3.5 py-2.5 flex flex-col">
                <label htmlFor={`edit-grade-${item.id}`} className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1">
                  鑑定等級
                </label>
                <select
                  id={`edit-grade-${item.id}`}
                  name="card-grade"
                  defaultValue={item.grade}
                  className="w-full bg-transparent text-text-primary text-[13px] font-bold focus:outline-none appearance-none cursor-pointer mt-1"
                >
                  <option className="bg-[#1A1612]">PSA 10</option>
                  <option className="bg-[#1A1612]">PSA 9</option>
                  <option className="bg-[#1A1612]">PSA 8</option>
                  <option className="bg-[#1A1612]">BGS 9.5</option>
                  <option className="bg-[#1A1612]">BGS 9</option>
                  <option className="bg-[#1A1612]">CGC 10</option>
                  <option className="bg-[#1A1612]">CGC 9</option>
                  <option className="bg-[#1A1612]">RAW NM</option>
                  <option className="bg-[#1A1612]">RAW EX</option>
                </select>
              </div>
            </div>

            <div className="bg-[#17130f] border border-white/5 rounded-xl px-3.5 py-2.5 flex flex-col">
              <label htmlFor={`edit-condition-${item.id}`} className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1">
                品相備註
              </label>
              <input
                id={`edit-condition-${item.id}`}
                name="condition-notes"
                type="text"
                defaultValue={item.conditionDesc}
                placeholder="例：角落完美，居中良好"
                className="w-full bg-transparent text-text-primary text-[13px] focus:outline-none mt-1"
              />
            </div>

            <div className="grid grid-cols-1 gap-3.5 flex-1">
              <div className="bg-[#17130f] border border-white/5 rounded-xl p-3.5 flex flex-col min-h-[95px] flex-1">
                <label htmlFor={`edit-desc-${item.id}`} className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1">
                  品相描述
                </label>
                <textarea
                  id={`edit-desc-${item.id}`}
                  name="condition-desc"
                  rows={2}
                  defaultValue={item.conditionDesc}
                  placeholder="詳細描述卡面狀況、印刷品質、鏡面完整度等..."
                  className="w-full bg-transparent text-text-primary text-[12.5px] leading-relaxed placeholder-text-disabled resize-none focus:outline-none flex-1 mt-1"
                />
              </div>

              <div className="bg-[#17130f] border border-white/5 rounded-xl p-3.5 flex flex-col min-h-[85px] flex-1">
                <label htmlFor={`edit-edge-${item.id}`} className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1">
                  邊角磨損屬性
                </label>
                <textarea
                  id={`edit-edge-${item.id}`}
                  name="edge-wear"
                  rows={2}
                  defaultValue={item.edgeWear}
                  placeholder="描述各角磨損、白邊情況、封殼狀態..."
                  className="w-full bg-transparent text-text-primary text-[12.5px] leading-relaxed placeholder-text-disabled resize-none focus:outline-none flex-1 mt-1"
                />
              </div>
            </div>

            <div>
              <p className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1.5">
                實物照片 (必須 4–6 張) <span className="text-warning">*</span>
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Array.from({ length: 6 }, (_, i) => {
                  const presetRemark = i === 0 ? "卡牌正面全貌" : i === 1 ? "背面右上角帶微白點" : i === 2 ? "左下邊角銳利特寫" : i === 3 ? "封殼完美無裂紋" : "";
                  return (
                    <div key={i} className="flex flex-col">
                      <div
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
                      <input
                        type="text"
                        name={`photo-remark-${i}`}
                        placeholder="照片備註（例：背面左上角微白）"
                        defaultValue={presetRemark}
                        className="w-full bg-[#17130f] border border-white/5 rounded-lg h-8 px-2 font-sans text-[11px] text-text-primary focus:outline-none placeholder-text-disabled mt-1.5"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  name="is-active"
                  defaultChecked={item.status === "active"}
                  className="w-4 h-4 rounded accent-brand cursor-pointer"
                />
                <span className="font-mono text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">
                  商品上架
                </span>
              </label>

              <button
                type="submit"
                className="px-5 h-10 bg-brand text-[#17130f] font-sans font-bold text-[13.5px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                確認儲存修改
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sku Items List Module ───────────────────────────────────────────────────

interface SkuItemsListProps {
  sku: SKUGroup;
}

function SkuItemsList({ sku }: SkuItemsListProps) {
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
        <CardInstanceRow key={item.id} sku={sku} item={item} />
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
}

export function InventoryAccordion({ skuGroups, analytics = true }: InventoryAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
      {skuGroups.map((sku, i) => {
        const isOpen = openId === sku.id;
        const activeItems = sku.items.filter((item) => item.status === "active");
        const totalOffers = sku.items.reduce((acc, item) => acc + (item.offersCount || 0), 0);
        const hasActiveOffer = sku.items.some((item) => (item.offersCount || 0) > 0);

        return (
          <div
            key={sku.id}
            className={i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : sku.id)}
              aria-expanded={isOpen}
              aria-controls={`sku-panel-${sku.id}`}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                isOpen ? "bg-bg-elevated" : "hover:bg-bg-elevated"
              }`}
            >
              <div className="relative w-14 h-20 rounded-md overflow-hidden border border-[rgba(237,232,224,0.08)] shrink-0">
                <Image
                  src={`https://picsum.photos/seed/${sku.thumbnailSeed}/112/160`}
                  alt={`${sku.cardName} 縮圖`}
                  fill
                  sizes="56px"
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
                    共計 {sku.items.length} 張現貨
                  </span>
                  { activeItems.length > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded text-success bg-[rgba(16,185,129,0.12)]">
                      {activeItems.length} 上架中
                    </span>
                  ) }
                  {totalOffers > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded text-warning bg-[rgba(239,68,68,0.10)] font-bold animate-pulse">
                      {totalOffers} 次叫價
                    </span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-text-secondary mt-0.5">
                  {sku.cardNo}
                </p>
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
                <div className="bg-[rgba(212,165,116,0.02)] border-t border-[rgba(212,165,116,0.10)] px-4 pt-4 pb-4 space-y-3">

                  <SkuItemsList sku={sku} />

                  {analytics ? 
                  <div className="pt-1 border-t border-[rgba(237,232,224,0.06)]">
                    <Link
                      href={`/profile/merchant/analytics?sku=${sku.cardNo}`}
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

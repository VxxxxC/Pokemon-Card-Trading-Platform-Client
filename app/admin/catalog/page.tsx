"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";
import { CatalogCard } from "@/app/components/admin/CatalogCard";
import { ImageViewer } from "@/app/components/shared/ImageViewer";
import { Pagination } from "@/app/components/ui/Pagination";
import {
  listAdminCatalogEntries,
  type AdminCatalogEntry,
  type AdminCatalogItemKind,
} from "@/app/actions/adminCatalog";
import {
  CATALOG_TYPE_LABELS,
  type CatalogType,
} from "@/lib/constants/commerce";

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 300;

const RARITY_OPTIONS = [
  { value: "SAR", label: "SAR" },
  { value: "UR", label: "UR" },
  { value: "SR", label: "SR" },
  { value: "AR", label: "AR" },
  { value: "RR", label: "RR" },
  { value: "R", label: "R" },
  { value: "U", label: "U" },
  { value: "C", label: "C" },
  { value: "Holo", label: "Holo" },
  { value: "PROMO", label: "PROMO" },
];

const BOX_SET_CATEGORY_OPTIONS: { value: CatalogType | "jan_code"; label: string }[] = [
  { value: "booster_pack", label: "補充包" },
  { value: "gift_set", label: "禮盒組" },
  { value: "starter_deck", label: "起始牌組" },
  { value: "jan_code", label: "JAN 條碼規格" },
];

type ManualEntryBase = {
  id: string;
  cardNumber: string;
  setCode: string;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  rarity: string;
  imageSource: string;
  createdAt: string;
};

type ManualCardEntry = ManualEntryBase & {
  itemKind: "card";
};

type ManualBoxSetEntry = ManualEntryBase & {
  itemKind: "box_set";
  category: CatalogType | "jan_code";
};

type ManualEntry = ManualCardEntry | ManualBoxSetEntry;

type FormErrors = {
  cardNumber?: boolean;
  setCode?: boolean;
  nameLanguages?: boolean;
  category?: boolean;
  image?: boolean;
  rarity?: boolean;
};

const TABS_TRIGGER_CLASS =
  "min-h-[44px] px-4 py-2 rounded-lg font-sans text-[13px] transition-colors data-[state=active]:bg-bg-elevated data-[state=active]:text-brand data-[state=active]:font-semibold text-text-secondary hover:text-text-primary";

const getCategoryLabel = (cat: CatalogType | "jan_code") => {
  if (cat === "jan_code") return "JAN 條碼規格";
  return CATALOG_TYPE_LABELS[cat as CatalogType] || cat;
};

export default function AdminCatalogPage() {
  // ── Catalog browsing state
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [itemKind, setItemKind] = useState<AdminCatalogItemKind>("card");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<AdminCatalogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Manual entry local state (db has no INSERT policy yet)
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [manualTab, setManualTab] = useState<AdminCatalogItemKind>("card");
  const [pendingManualEntries, setPendingManualEntries] = useState<
    Record<
      AdminCatalogItemKind,
      | Omit<ManualCardEntry, "id" | "itemKind" | "createdAt">
      | Omit<ManualBoxSetEntry, "id" | "itemKind" | "createdAt">
    >
  >({
    card: {
      cardNumber: "",
      setCode: "",
      nameEn: "",
      nameZh: "",
      nameJa: "",
      rarity: "",
      imageSource: "",
    },
    box_set: {
      cardNumber: "",
      setCode: "",
      nameEn: "",
      nameZh: "",
      nameJa: "",
      rarity: "",
      imageSource: "",
      category: "booster_pack",
    },
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  // ── Search debounce
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, itemKind]);

  // ── Fetch catalog entries with race-condition guard
  useEffect(() => {
    let stale = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      const result = await listAdminCatalogEntries({
        query: debouncedQuery,
        itemKind,
        page,
        pageSize: PAGE_SIZE,
      });

      if (stale) return;

      if (!result.success) {
        setError(result.error);
        setEntries([]);
        setTotal(0);
        setIsLoading(false);
        return;
      }

      setEntries(result.data);
      setTotal(result.total);
      setError(null);
      setIsLoading(false);
    }

    load();

    return () => {
      stale = true;
    };
  }, [debouncedQuery, itemKind, page]);

  // 手動錄入條目僅存在於前端 local state（product_catalog 未有 INSERT policy）。
  //
  // 【設計決策】唔可以將 local 條目混入 DB 嘅 server-side 分頁：
  // server 用 .range() 按 PAGE_SIZE 切片，如果前端再 prepend 本地條目並裁切，
  // 就會將該頁最後一筆 DB 資料擠走，而下一頁嘅 range 又唔會補回，造成資料永久遺失。
  // 因此手動條目獨立成一個 pending section 顯示，完全唔參與 DB 分頁計算。
  const manualForKind = useMemo<AdminCatalogEntry[]>(
    () =>
      manualEntries
        .filter((m) => m.itemKind === itemKind)
        .map((m) => ({
          id: m.id,
          nameJa: m.nameJa || m.nameZh || m.nameEn,
          nameEn: m.nameEn || null,
          nameZh: m.nameZh || null,
          setCode: m.setCode,
          cardNumber: m.cardNumber || null,
          displayId: null,
          janCode:
            m.itemKind === "box_set" && m.category === "jan_code"
              ? m.cardNumber
              : null,
          imageUrl: m.imageSource,
          type:
            m.itemKind === "box_set"
              ? m.category === "jan_code"
                ? "booster_pack"
                : m.category
              : "single_card",
          rarity: m.rarity,
          pokemonStage: null,
          updatedAt: m.createdAt,
        })),
    [manualEntries, itemKind],
  );

  const totalPages = useMemo(
    () => (total === 0 ? 0 : Math.ceil(total / PAGE_SIZE)),
    [total],
  );
  const safePage = useMemo(
    () => (totalPages === 0 ? 1 : Math.min(page, totalPages)),
    [page, totalPages],
  );

  useEffect(() => {
    if (safePage !== page && totalPages > 0) {
      setPage(safePage);
    }
  }, [safePage, page, totalPages]);

  // ImageViewer 以「pending section 在前、DB Grid 在後」嘅視覺順序組成單一圖片陣列，
  // 令左右揭頁次序同畫面所見一致。
  const viewerEntries = useMemo(
    () => [...manualForKind, ...entries],
    [manualForKind, entries],
  );

  const viewerImages = useMemo(
    () => viewerEntries.map((entry) => entry.imageUrl),
    [viewerEntries],
  );

  function handleImageClick(entry: AdminCatalogEntry) {
    const index = viewerEntries.findIndex((e) => e.id === entry.id);
    setViewerInitialIndex(Math.max(0, index));
    setViewerOpen(true);
  }

  function clearObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  function resetImagePreview() {
    clearObjectUrl();
    setImagePreview("");
    setImageFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetManualForm(kind: AdminCatalogItemKind) {
    setPendingManualEntries((prev) => ({
      ...prev,
      [kind]:
        kind === "card"
          ? {
              cardNumber: "",
              setCode: "",
              nameEn: "",
              nameZh: "",
              nameJa: "",
              rarity: "",
              imageSource: "",
            }
          : {
              cardNumber: "",
              setCode: "",
              nameEn: "",
              nameZh: "",
              nameJa: "",
              rarity: "",
              imageSource: "",
              category: "booster_pack",
            },
    }));
    resetImagePreview();
    setFormErrors({});
  }

  function handleOpenManualDialog() {
    setManualTab(itemKind);
    resetManualForm(itemKind);
    setIsManualDialogOpen(true);
  }

  function handleCloseManualDialog() {
    setIsManualDialogOpen(false);
    resetImagePreview();
  }

  function updateManualField<K extends keyof ManualEntryBase>(
    kind: AdminCatalogItemKind,
    field: K,
    value: ManualEntryBase[K],
  ) {
    setPendingManualEntries((prev) => ({
      ...prev,
      [kind]: { ...prev[kind], [field]: value },
    }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: false }));
    }
  }

  function updateBoxSetField(
    field: "category",
    value: CatalogType | "jan_code",
  ) {
    setPendingManualEntries((prev) => ({
      ...prev,
      box_set: { ...prev.box_set, [field]: value },
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: false }));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("僅支援圖片格式檔案 (image/*)");
      return;
    }
    clearObjectUrl();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImagePreview(url);
    setImageFileName(file.name);
    updateManualField(manualTab, "imageSource", url);
    setFormErrors((prev) => ({ ...prev, image: false }));
  }

  function handleImageUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.trim();
    updateManualField(manualTab, "imageSource", value);
    if (value) {
      clearObjectUrl();
      setImageFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setImagePreview(value);
    } else if (!objectUrlRef.current) {
      setImagePreview("");
    }
    setFormErrors((prev) => ({ ...prev, image: false }));
  }

  function validateManualForm(): boolean {
    const current = pendingManualEntries[manualTab];
    const errors: FormErrors = {};

    if (!current.cardNumber.trim()) {
      errors.cardNumber = true;
    }
    if (!current.setCode.trim()) {
      errors.setCode = true;
    }
    if (
      !current.nameEn.trim() &&
      !current.nameZh.trim() &&
      !current.nameJa.trim()
    ) {
      errors.nameLanguages = true;
    }
    if (!current.rarity.trim()) {
      errors.rarity = true;
    }
    if (!current.imageSource.trim()) {
      errors.image = true;
    }

    if (manualTab === "box_set") {
      const box = current as ManualBoxSetEntry;
      if (!box.category) {
        errors.category = true;
      }
      if (box.category === "jan_code") {
        if (!/^\d+$/.test(box.cardNumber.trim())) {
          errors.cardNumber = true;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleManualSubmit() {
    if (!validateManualForm()) {
      if (formErrors.nameLanguages) {
        toast.error("請至少輸入一種語言嘅卡牌名稱（英文／中文／日文）");
      } else if (
        manualTab === "box_set" &&
        (pendingManualEntries.box_set as ManualBoxSetEntry).category ===
          "jan_code" &&
        formErrors.cardNumber
      ) {
        toast.error("輸入之 JAN Code 必須為全數字 13 位條碼");
      } else if (formErrors.rarity) {
        toast.error("請選擇罕有度");
      } else {
        toast.error("請填寫所有必填欄位並檢查格式");
      }
      return;
    }

    const current = pendingManualEntries[manualTab];
    const newEntry: ManualEntry =
      manualTab === "box_set"
        ? {
            ...(current as ManualBoxSetEntry),
            id: `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            itemKind: "box_set",
            createdAt: new Date().toISOString(),
          }
        : {
            ...(current as ManualCardEntry),
            id: `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            itemKind: "card",
            createdAt: new Date().toISOString(),
          };

    // TODO: [Supabase Wiring] Target Table: product_catalog | RPC: insert_card_catalog_entry
    // 目前 product_catalog 只有 SELECT policy，未有 INSERT policy。
    // 待補 migration（admin insert policy + is_admin() SECURITY DEFINER）後改為真正寫入。
    setManualEntries((prev) => [newEntry, ...prev]);
    toast.success("已新增手動錄入條目（尚未寫入資料庫）");

    handleCloseManualDialog();
    resetManualForm(manualTab);
  }

  const gridItemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
      },
    }),
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-sans font-bold text-[24px] text-text-primary">
            卡牌字典資料庫
          </h1>
          <p className="font-sans text-[13px] text-text-secondary mt-0.5">
            檢視並管理 product_catalog 卡牌資料；手動錄入工具供無 API
            覆蓋的小眾或舊版卡牌條目使用。
          </p>
        </div>
      </div>

      {/* ── Search + Manual Entry Trigger ─────────────────────────────── */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 space-y-4">
        <div className="relative w-full">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋編號、卡名、系列代碼或 JAN Code..."
            className="w-full h-11 pl-10 pr-4 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-[14px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40"
          />
          <SmartSearch
            query={query}
            onSelect={() => {}}
            listings={[]}
            isOpen={false}
            suppressDropdown
          />
        </div>

        <Button
          type="button"
          onClick={handleOpenManualDialog}
          className="w-full min-h-[44px] bg-brand text-[#17130f] font-sans font-bold text-[14px] rounded-lg hover:bg-brand-hover active:scale-[0.98] transition-transform shadow-lg shadow-brand/10"
        >
          手動錄入卡牌
        </Button>
      </div>

      {/* ── Catalog Tabs & Grid ───────────────────────────────────────── */}
      <Tabs
        value={itemKind}
        onValueChange={(value) => setItemKind(value as AdminCatalogItemKind)}
        className="space-y-4"
      >
        <TabsList className="bg-bg-card border border-[rgba(237,232,224,0.08)] p-1 rounded-xl">
          <TabsTrigger value="card" className={TABS_TRIGGER_CLASS}>
            獨立卡
          </TabsTrigger>
          <TabsTrigger value="box_set" className={TABS_TRIGGER_CLASS}>
            Box / Set
          </TabsTrigger>
        </TabsList>

        <TabsContent value="card" className="space-y-4">
          {renderGrid()}
        </TabsContent>
        <TabsContent value="box_set" className="space-y-4">
          {renderGrid()}
        </TabsContent>
      </Tabs>

      <ImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={viewerImages}
        initialIndex={viewerInitialIndex}
      />

      {/* ── Full-screen Manual Entry Dialog ─────────────────────────────
          注意：DialogContent base class 含 `sm:max-w-sm` 同 `ring-1`。
          tailwind-merge 無法以無斷點嘅 `max-w-full` 蓋過帶斷點嘅 `sm:max-w-sm`，
          故必須顯式加 `sm:max-w-full`；`ring-0` 同理用嚟清走 base 嘅 ring。 */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="fixed inset-0 top-0 left-0 z-[70] w-full max-w-full sm:max-w-full h-[100dvh] max-h-[100dvh] translate-x-0 translate-y-0 rounded-none p-0 gap-0 flex flex-col overflow-hidden bg-bg-card border-0 ring-0"
        >
          {/* Sticky header */}
          <DialogHeader className="shrink-0 flex flex-row items-center justify-between gap-4 px-5 py-4 border-b border-[rgba(237,232,224,0.08)] bg-bg-card">
            <DialogTitle className="font-sans font-bold text-[18px] text-text-primary">
              手動錄入卡牌
            </DialogTitle>
            <button
              type="button"
              onClick={handleCloseManualDialog}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              aria-label="關閉"
            >
              ✕
            </button>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-5">
            <Tabs
              value={manualTab}
              onValueChange={(value) =>
                setManualTab(value as AdminCatalogItemKind)
              }
              className="space-y-5"
            >
              <TabsList className="bg-bg-page border border-[rgba(237,232,224,0.08)] p-1 rounded-xl">
                <TabsTrigger value="card" className={TABS_TRIGGER_CLASS}>
                  獨立卡
                </TabsTrigger>
                <TabsTrigger value="box_set" className={TABS_TRIGGER_CLASS}>
                  Box / Set
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-5">
                {renderManualForm("card")}
              </TabsContent>
              <TabsContent value="box_set" className="space-y-5">
                {renderManualForm("box_set")}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky footer */}
          <DialogFooter className="shrink-0 flex-col sm:flex-row justify-end gap-2 px-5 py-4 border-t border-[rgba(237,232,224,0.08)] bg-bg-page rounded-none m-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseManualDialog}
              className="min-h-[44px] px-5 rounded-lg border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary font-sans font-semibold text-[13px] hover:bg-bg-elevated hover:text-text-primary active:scale-[0.98]"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleManualSubmit}
              className="min-h-[44px] px-5 bg-brand text-[#17130f] font-sans font-bold text-[13px] rounded-lg hover:bg-brand-hover active:scale-[0.98]"
            >
              送出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderGrid() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-3 flex flex-col justify-between h-full space-y-3"
            >
              <Skeleton className="w-full aspect-[3/4] rounded-xl bg-[#26211C]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 bg-[#26211C]" />
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3 w-1/3 bg-[#26211C]" />
                  <Skeleton className="h-3 w-1/4 bg-[#26211C]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)]">
          <p className="font-sans text-[15px] text-warning text-center">
            {error}
          </p>
          <p className="font-sans text-[13px] text-text-secondary mt-2 text-center">
            請稍後再試，或檢查搜尋關鍵字是否包含特殊字元。
          </p>
        </div>
      );
    }

    if (manualForKind.length === 0 && entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)]">
          <p className="font-sans text-[15px] text-text-primary text-center">
            暫無符合條件的卡牌資料
          </p>
          <p className="font-sans text-[13px] text-text-secondary mt-2 text-center">
            調整搜尋關鍵字，或是點擊「手動錄入卡牌」新增一筆資料。
          </p>
        </div>
      );
    }

    return (
      <>
        {/* ── Pending manual entries — 獨立區塊，不參與 DB 分頁 ───────── */}
        <AnimatePresence>
          {manualForKind.length > 0 && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              aria-labelledby="pending-manual-heading"
            >
              <div className="space-y-3 p-4 rounded-2xl bg-[rgba(212,165,116,0.06)] border border-brand/20">
                <div className="flex items-center gap-2">
                  <span className="text-brand text-[13px]">✎</span>
                  <h3
                    id="pending-manual-heading"
                    className="font-sans text-[13px] font-semibold text-text-primary"
                  >
                    待寫入資料庫的手動錄入條目
                    <span className="ml-2 font-mono text-brand">
                      {manualForKind.length}
                    </span>
                  </h3>
                </div>
                <p className="font-sans text-[12px] text-text-secondary">
                  以下條目僅暫存於本次瀏覽階段，尚未寫入
                  <span className="font-mono"> product_catalog</span>
                  ，重新整理後將會消失。
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {manualForKind.map((entry, i) => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -top-2 -right-2 z-10">
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand text-[#17130f] border border-brand/30 shadow-md">
                          待審核
                        </span>
                      </div>
                      <CatalogCard
                        entry={entry}
                        onImageClick={handleImageClick}
                        imagePriority={i < 4}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              custom={i}
              variants={gridItemVariants}
              className="relative"
            >
              <CatalogCard
                entry={entry}
                onImageClick={handleImageClick}
                imagePriority={manualForKind.length === 0 && i < 4}
              />
            </motion.div>
          ))}
        </motion.div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={total}
          itemsPerPage={PAGE_SIZE}
          itemLabel="筆資料"
          enableScroll={true}
        />
      </>
    );
  }

  function renderManualForm(kind: AdminCatalogItemKind) {
    const current = pendingManualEntries[kind];
    const isJanCodeCategory =
      kind === "box_set" &&
      (current as ManualBoxSetEntry).category === "jan_code";

    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category Dropdown at the VERY TOP for Box/Set */}
          {kind === "box_set" && (
            <div className="space-y-1.5 min-w-0 sm:col-span-2">
              <Label className="font-mono text-[11px] text-text-secondary">
                Category <span className="text-warning">*</span>
              </Label>
              <Select
                value={(current as ManualBoxSetEntry).category}
                onValueChange={(value) =>
                  updateBoxSetField(
                    "category",
                    (value as CatalogType | "jan_code") ?? "booster_pack",
                  )
                }
              >
                <SelectTrigger
                  className={`h-10 w-full min-w-0 max-w-full overflow-hidden truncate bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[13px] text-text-primary ${
                    formErrors.category ? "border-warning" : ""
                  }`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#26211C] w-[var(--radix-select-trigger-width)] max-w-full">
                  {BOX_SET_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 編號 (Renamed from 卡牌編號) */}
          <div className="space-y-1.5 min-w-0">
            <Label className="font-mono text-[11px] text-text-secondary">
              編號 <span className="text-warning">*</span>
            </Label>
            <Input
              type={isJanCodeCategory ? "number" : "text"}
              value={current.cardNumber}
              onChange={(e) =>
                updateManualField(kind, "cardNumber", e.target.value)
              }
              placeholder={
                isJanCodeCategory ? "例：4904140548311" : "例：promo-102"
              }
              className={`h-10 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-mono text-[13px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 ${
                formErrors.cardNumber ? "border-warning" : ""
              }`}
            />
            {isJanCodeCategory && (
              <p className="text-brand text-[11px] font-mono mt-1">
                💡 提示：輸入之 JAN Code 必須為全數字 13 位條碼
              </p>
            )}
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label className="font-mono text-[11px] text-text-secondary">
              系列/卡包代碼 <span className="text-warning">*</span>
            </Label>
            <Input
              type="text"
              value={current.setCode}
              onChange={(e) =>
                updateManualField(kind, "setCode", e.target.value)
              }
              placeholder="例：SV2a"
              className={`h-10 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-mono text-[13px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 ${
                formErrors.setCode ? "border-warning" : ""
              }`}
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label className="font-mono text-[11px] text-text-secondary">
              英文名稱
            </Label>
            <Input
              type="text"
              value={current.nameEn}
              onChange={(e) =>
                updateManualField(kind, "nameEn", e.target.value)
              }
              placeholder="例：Pikachu PROMO"
              className={`h-10 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[13px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 ${
                formErrors.nameLanguages ? "border-warning" : ""
              }`}
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label className="font-mono text-[11px] text-text-secondary">
              中文名稱
            </Label>
            <Input
              type="text"
              value={current.nameZh}
              onChange={(e) =>
                updateManualField(kind, "nameZh", e.target.value)
              }
              placeholder="例：皮卡丘 推廣卡"
              className={`h-10 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[13px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 ${
                formErrors.nameLanguages ? "border-warning" : ""
              }`}
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label className="font-mono text-[11px] text-text-secondary">
              日文名稱
            </Label>
            <Input
              type="text"
              value={current.nameJa}
              onChange={(e) =>
                updateManualField(kind, "nameJa", e.target.value)
              }
              placeholder="例：ピカチュウ"
              className={`h-10 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[13px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 ${
                formErrors.nameLanguages ? "border-warning" : ""
              }`}
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label className="font-mono text-[11px] text-text-secondary">
              罕有度 <span className="text-warning">*</span>
            </Label>
            <Select
              value={current.rarity}
              onValueChange={(value) =>
                updateManualField(kind, "rarity", value ?? "")
              }
            >
              <SelectTrigger
                className={`h-10 w-full min-w-0 max-w-full overflow-hidden truncate bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-mono text-[13px] text-text-primary ${
                  formErrors.rarity ? "border-warning" : ""
                }`}
              >
                <SelectValue placeholder="請選擇罕有度 *" />
              </SelectTrigger>
              <SelectContent className="bg-[#26211C] w-[var(--radix-select-trigger-width)] max-w-full">
                {RARITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {formErrors.nameLanguages && (
          <p className="font-sans text-[12px] text-warning">
            請至少輸入一種語言嘅卡牌名稱（英文／中文／日文）
          </p>
        )}

        {/* Image upload */}
        <div className="space-y-1.5">
          <Label className="font-mono text-[11px] text-text-secondary">
            卡牌圖片 <span className="text-warning">*</span>
          </Label>
          <div className="flex gap-4">
            <div className="shrink-0">
              {imagePreview ? (
                <div className="relative w-20 h-[110px]">
                  <Image
                    src={imagePreview}
                    alt="預覽"
                    fill
                    className="rounded-lg object-cover border border-[rgba(237,232,224,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetImagePreview();
                      updateManualField(kind, "imageSource", "");
                    }}
                    aria-label="移除圖片"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center active:scale-[0.9] transition-transform"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="w-20 h-[110px] rounded-lg bg-bg-page border border-dashed border-[rgba(237,232,224,0.16)] flex items-center justify-center">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#50453b"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-[11px] font-mono text-text-secondary file:mr-3 file:h-9 file:px-3 file:rounded-lg file:border-0 file:bg-[rgba(212,165,116,0.15)] file:text-brand file:font-sans file:font-bold file:text-[11px] file:cursor-pointer hover:file:bg-[rgba(212,165,116,0.25)]"
              />
              <Input
                type="text"
                value={current.imageSource}
                onChange={handleImageUrlChange}
                placeholder="或貼上圖片 URL（備援）"
                className={`h-9 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-lg px-3 font-mono text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 ${
                  formErrors.image ? "border-warning" : ""
                }`}
              />
              {imageFileName && (
                <p className="font-mono text-[10px] text-text-disabled truncate">
                  已選：{imageFileName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Type preview */}
        <div className="rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page p-3">
          <p className="font-sans text-[12px] text-text-secondary">
            即將新增條目類型：
            <span className="text-brand font-semibold ml-1">
              {kind === "card"
                ? "獨立卡（single_card）"
                : `Box/Set（${getCategoryLabel((current as ManualBoxSetEntry).category)}）`}
            </span>
          </p>
        </div>
      </div>
    );
  }
}

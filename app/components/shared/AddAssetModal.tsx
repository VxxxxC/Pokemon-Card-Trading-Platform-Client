"use client";

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { addToCollection } from "@/app/actions/collection";
import { submitCardListingWithProgress } from "@/lib/listings/submit-card-listing";
import { useUIStore, type SellFromCollectionPrefill } from "@/app/store/useUIStore";
import { useListingSubmitStore } from "@/app/store/useListingSubmitStore";
import { useProductCatalogSearch } from "@/app/lib/hooks/useProductCatalogSearch";
import type { ProductCatalogSuggestion } from "@/app/actions/productCatalog";
import {
  DEFAULT_GRADING_OPTION_ID,
  GRADING_OPTION_GROUPS,
  getGradingOption,
  getGradingOptionsByGroup,
  gradingOptionToFields,
  isRawGradingOption,
} from "@/lib/grading/options";
import type { ListingImage } from "@/lib/listings/images";
import {
  LISTING_IMAGE_MAX,
  LISTING_IMAGE_MIN,
} from "@/lib/listings/images";
import {
  LISTING_DESCRIPTION_MAX,
  validateCreateCardListing,
  validateImageFile,
} from "@/lib/listings/validation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LISTING_AUTH_SERVICE_TOOLTIP_BODY,
  LISTING_AUTH_SERVICE_TOOLTIP_TITLE,
} from "@/lib/listings/auth-service-copy";
import { CircleHelp } from "lucide-react";

type LocalPhotoSlot = {
  file: File | null;
  previewUrl: string | null;
};

function createEmptyPhotoSlots(): LocalPhotoSlot[] {
  return Array.from({ length: LISTING_IMAGE_MAX }, () => ({
    file: null,
    previewUrl: null,
  }));
}

function revokePhotoSlots(slots: LocalPhotoSlot[]) {
  for (const slot of slots) {
    if (slot.previewUrl) {
      URL.revokeObjectURL(slot.previewUrl);
    }
  }
}

function suggestionFromSellPrefill(
  prefill: SellFromCollectionPrefill,
): ProductCatalogSuggestion {
  return {
    id: prefill.productId,
    name: prefill.catalog.name,
    nameJa: prefill.catalog.name,
    nameEn: null,
    nameZh: null,
    setCode: prefill.catalog.setCode,
    cardNumber: prefill.catalog.cardNumber ?? null,
    displayId: prefill.catalog.displayId ?? null,
    imageUrl: prefill.catalog.imageUrl ?? "",
    type: "single_card",
    rarity: prefill.catalog.rarity ?? null,
    pokemonStage: null,
  };
}

// 嚴格定義全域資產數據合約
export interface GlobalAssetPayload {
  id: string;
  name: string;
  set: string;
  cardNo: string;
  grade: string;
  grader: "PSA" | "BGS" | "CGC" | "RAW" | "OTHER" | string;
  purchasePrice: number; // 僅收藏愛好使用
  currentValue: number; // 僅收藏愛好使用
  sellingPrice: number; // 僅新增商品使用
  status: "holding" | "listed" | "grading";
  isHobbyOnly: boolean;
  images: string[] | ListingImage[];
  condition?: string;
  conditionDesc?: string;
  photosRemark?: string[];
}

export function AddAssetModal() {
  const isOpen = useUIStore((state) => state.isAddAssetOpen);
  const globalMode = useUIStore((state) => state.addAssetMode);
  const sellPrefill = useUIStore((state) => state.addAssetSellPrefill);
  const closeAddAssetModal = useUIStore((state) => state.closeAddAssetModal);

  // 模式 Toggle 狀態
  const [mode, setMode] = useState<"hobby" | "merch">("hobby");

  // 🏛️ Symmetrical Item-Type State
  const [itemType, setItemType] = useState<"card" | "box_set">("card");

  // 🟢 核心對齊：整合統一的單一 SKU 搜尋狀態，消除個別欄位
  const [set, setSet] = useState(""); // 擴充包系列仍為選填欄位

  const catalogItemType = itemType === "box_set" ? "box_set" : "card";
  const catalogSearch = useProductCatalogSearch(catalogItemType, {
    enabled: isOpen,
  });

  const [selectedGradingId, setSelectedGradingId] = useState(
    DEFAULT_GRADING_OPTION_ID,
  );
  const [acceptsBuyerAuth, setAcceptsBuyerAuth] = useState(false);
  const selectedGrading = useMemo(
    () => getGradingOption(selectedGradingId),
    [selectedGradingId],
  );
  const isRawCardListing = isRawGradingOption(selectedGrading);

  const handleGradingChange = (gradingId: string) => {
    setSelectedGradingId(gradingId);
    setAcceptsBuyerAuth(isRawGradingOption(getGradingOption(gradingId)));
  };

  // 收藏愛好專屬欄位
  const [purchasePrice, setPurchasePrice] = useState("");

  // 新增商品專屬欄位
  const [sellingPrice, setSellingPrice] = useState("");

  // 圖片預覽槽（僅於提交時上傳至 Bunny.net）
  const [photoSlots, setPhotoSlots] = useState<LocalPhotoSlot[]>(
    createEmptyPhotoSlots,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 收藏愛好模式沿用簡易預覽陣列
  const [hobbyImages, setHobbyImages] = useState<string[]>([]);

  const [conditionDesc, setConditionDesc] = useState("");
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const listingSubmitPhase = useListingSubmitStore((state) => state.phase);
  const listingSubmitOpen = useListingSubmitStore((state) => state.isOpen);
  const isSubmitting =
    listingSubmitOpen &&
    listingSubmitPhase !== "idle" &&
    listingSubmitPhase !== "error";

  // 🟢 記憶體時空守衛
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  const photoSlotsRef = useRef<LocalPhotoSlot[]>(createEmptyPhotoSlots());

  useEffect(() => {
    photoSlotsRef.current = photoSlots;
  }, [photoSlots]);

  const resetPhotoSlots = useCallback(() => {
    setPhotoSlots((prev) => {
      revokePhotoSlots(prev);
      return createEmptyPhotoSlots();
    });
  }, []);

  useEffect(() => {
    return () => {
      revokePhotoSlots(photoSlotsRef.current);
    };
  }, []);

  const displayMode = sellPrefill
    ? "上架出售收藏"
    : mode === "hobby"
      ? "收藏愛好"
      : "新增商品";

  const filledPhotoCount = useMemo(
    () => photoSlots.filter((slot) => slot.file).length,
    [photoSlots],
  );
  const boxSetBadge = useMemo(() => {
    if (itemType !== "box_set" || !catalogSearch.query) return null;
    const lower = catalogSearch.query.toLowerCase();
    if (lower.includes("box") || lower.includes("盒")) {
      return (
        <span className="text-orange-400 bg-orange-500/10 border border-orange-500/20 font-mono px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 animate-fadeIn">
          BOX
        </span>
      );
    }
    if (lower.includes("set") || lower.includes("套")) {
      return (
        <span className="text-purple-400 bg-purple-500/10 border border-purple-500/20 font-mono px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 animate-fadeIn">
          SET
        </span>
      );
    }
    return null;
  }, [itemType, catalogSearch.query]);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      catalogSearch.clearSearch();
      if (sellPrefill) {
        const suggestion = suggestionFromSellPrefill(sellPrefill);
        catalogSearch.selectSuggestion(suggestion);
        setMode("merch");
        setItemType("card");
        setSet(sellPrefill.catalog.setCode);
        setSelectedGradingId(sellPrefill.gradingOptionId);
        setSellingPrice(String(sellPrefill.sellingPrice));
        setAcceptsBuyerAuth(
          isRawGradingOption(getGradingOption(sellPrefill.gradingOptionId)),
        );
        setPurchasePrice("");
        setHobbyImages([]);
        resetPhotoSlots();
        setConditionDesc("");
        setActiveSlotIndex(null);
      } else {
        setMode(globalMode);
        setItemType("card");
        setSet("");
        setSelectedGradingId(DEFAULT_GRADING_OPTION_ID);
        setPurchasePrice("");
        setSellingPrice("");
        setAcceptsBuyerAuth(false);
        setHobbyImages([]);
        resetPhotoSlots();
        setConditionDesc("");
        setActiveSlotIndex(null);
      }
    }
  }

  if (!isOpen) return null;

  const buildNextPhotoSlots = (
    prev: LocalPhotoSlot[],
    files: File[],
    startIndex: number,
  ): {
    next: LocalPhotoSlot[];
    assigned: number;
    skipped: number;
    fileErrors: string[];
  } => {
    const next = [...prev];
    let slotIndex = startIndex;
    let assigned = 0;
    let skipped = 0;
    const fileErrors: string[] = [];

    for (const file of files) {
      if (slotIndex >= LISTING_IMAGE_MAX) {
        skipped += 1;
        continue;
      }

      const fileError = validateImageFile(file);
      if (fileError) {
        fileErrors.push(`${file.name}: ${fileError}`);
        skipped += 1;
        continue;
      }

      const existing = next[slotIndex];
      if (existing.previewUrl) {
        URL.revokeObjectURL(existing.previewUrl);
      }

      next[slotIndex] = {
        file,
        previewUrl: URL.createObjectURL(file),
      };
      assigned += 1;
      slotIndex += 1;
    }

    return { next, assigned, skipped, fileErrors };
  };

  const applyFilesToPhotoSlots = (
    files: File[],
    startIndex: number,
  ): { assigned: number; skipped: number; fileErrors: string[] } => {
    const built = buildNextPhotoSlots(photoSlots, files, startIndex);

    setPhotoSlots(built.next);

    for (const message of built.fileErrors) {
      toast.error(`⚠️ ${message}`);
    }

    return {
      assigned: built.assigned,
      skipped: built.skipped,
      fileErrors: built.fileErrors,
    };
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    if (mode === "merch") {
      const startIndex =
        activeSlotIndex ??
        photoSlots.findIndex((slot) => !slot.file);

      if (startIndex === -1) {
        toast.error(`⚠️ 已達 ${LISTING_IMAGE_MAX} 張上限`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const { assigned, skipped } = applyFilesToPhotoSlots(files, startIndex);

      if (assigned > 0 && skipped > 0) {
        toast.message(
          `已加入 ${assigned} 張相片，${skipped} 張未加入（上限或格式不符）`,
        );
      }

      setActiveSlotIndex(null);
    } else {
      const remaining = LISTING_IMAGE_MAX - hobbyImages.length;
      if (remaining <= 0) {
        toast.error(`⚠️ 抱歉，實體相片上載上限為 ${LISTING_IMAGE_MAX} 張！`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const accepted: string[] = [];
      let skipped = 0;

      for (const file of files) {
        if (accepted.length >= remaining) {
          skipped += 1;
          continue;
        }

        const fileError = validateImageFile(file);
        if (fileError) {
          toast.error(`⚠️ ${file.name}: ${fileError}`);
          skipped += 1;
          continue;
        }

        accepted.push(URL.createObjectURL(file));
      }

      if (accepted.length > 0) {
        setHobbyImages((prev) => [...prev, ...accepted]);
      }

      if (accepted.length > 0 && skipped > 0) {
        toast.message(
          `已加入 ${accepted.length} 張相片，${skipped} 張未加入（上限或格式不符）`,
        );
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhotoSlot = (indexToRemove: number) => {
    setPhotoSlots((prev) => {
      const next = [...prev];
      const existing = next[indexToRemove];
      if (existing.previewUrl) {
        URL.revokeObjectURL(existing.previewUrl);
      }
      next[indexToRemove] = { file: null, previewUrl: null };
      return next;
    });
  };

  const handleRemoveHobbyImage = (indexToRemove: number) => {
    setHobbyImages((prev) => {
      const target = prev[indexToRemove];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const openPhotoPicker = (slotIndex: number) => {
    setActiveSlotIndex(slotIndex);
    fileInputRef.current?.click();
  };

  const handleSelectCatalogSuggestion = (
    suggestion: ProductCatalogSuggestion,
  ) => {
    catalogSearch.selectSuggestion(suggestion);
    setSet(suggestion.setCode);
  };

  const handleCloseAndReset = () => {
    if (isSubmitting) return;
    closeAddAssetModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "hobby") {
      if (!catalogSearch.selected) {
        toast.error("⚠️ 請從搜尋結果中選擇一張卡牌");
        return;
      }

      const parsedPurchasePrice = Number(purchasePrice);
      if (!Number.isFinite(parsedPurchasePrice) || parsedPurchasePrice < 0) {
        toast.error("⚠️ 請輸入有效的入手成本");
        return;
      }

      const result = await addToCollection({
        productId: catalogSearch.selected.id,
        gradingOptionId: selectedGradingId,
        purchasePrice: parsedPurchasePrice,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("★ 已成功收錄進您的私藏愛好清單");
      handleCloseAndReset();
      window.dispatchEvent(new CustomEvent("collection-should-refresh"));
      return;
    }

    if (mode === "merch" && itemType === "card") {
      const imageFiles = photoSlots
        .map((slot) => slot.file)
        .filter((file): file is File => file !== null);

      const validationError = validateCreateCardListing(
        {
          productId: catalogSearch.selected?.id ?? "",
          gradingOptionId: selectedGradingId,
          price: Number(sellingPrice),
          sellerDescription: conditionDesc || undefined,
        },
        imageFiles,
      );

      if (validationError) {
        toast.error(`⚠️ ${validationError}`);
        return;
      }

      if (!catalogSearch.selected) {
        toast.error("⚠️ 請從搜尋結果中選擇一張卡牌");
        return;
      }

      const result = await submitCardListingWithProgress({
        mode: "create",
        productId: catalogSearch.selected.id,
        gradingOptionId: selectedGradingId,
        price: Number(sellingPrice),
        sellerDescription: conditionDesc || undefined,
        useAuthentication: isRawCardListing ? acceptsBuyerAuth : false,
        imageFiles,
      });

      if (!result.success) {
        return;
      }

      const hadSellPrefill = Boolean(sellPrefill);
      const gradingFields = gradingOptionToFields(selectedGrading);

      const payload: GlobalAssetPayload = {
        id: result.data.listingId,
        name: catalogSearch.selected.name,
        set: set || catalogSearch.selected.setCode,
        cardNo:
          catalogSearch.selected.displayId ??
          catalogSearch.selected.cardNumber ??
          "",
        grade: gradingFields.gradeLabel,
        grader: gradingFields.grader,
        purchasePrice: 0,
        currentValue: 0,
        sellingPrice: Number(sellingPrice),
        status: "listed",
        isHobbyOnly: false,
        images: result.data.images,
        condition: gradingFields.condition,
        conditionDesc: conditionDesc || undefined,
      };

      window.dispatchEvent(
        new CustomEvent("global-asset-successfully-added", { detail: payload }),
      );

      if (hadSellPrefill) {
        window.dispatchEvent(new CustomEvent("collection-should-refresh"));
      }

      toast.success(
        hadSellPrefill
          ? "🏛️ 收藏品已成功上架發售"
          : "🏪 商品已成功錄入並直接上架交易所大盤",
      );
      handleCloseAndReset();
      return;
    }

    if (!catalogSearch.query && !sellPrefill) {
      toast.error("⚠️ 請填寫欲搜尋及上架的商品型號或名稱！");
      return;
    }

    if (mode === "merch" && itemType === "box_set") {
      const imageFiles = photoSlots
        .map((slot) => slot.file)
        .filter((file): file is File => file !== null);

      if (imageFiles.length < 1) {
        toast.error("新增 Box/Set 失敗！必須至少上載 1 張商品實物相片以資證明物況。");
        return;
      }

      if (!sellingPrice || Number(sellingPrice) <= 0) {
        toast.error("⚠️ 請輸入有效的商品放售售價！");
        return;
      }
    }

    const gradingFields =
      itemType === "box_set"
        ? null
        : gradingOptionToFields(selectedGrading);

    const payload: GlobalAssetPayload = {
      id: catalogSearch.selected?.id ?? `c-asset-${Date.now()}`,
      name: catalogSearch.query,
      set: set || catalogSearch.selected?.setCode || "PBR-Compiled",
      cardNo:
        catalogSearch.selected?.displayId ??
        catalogSearch.selected?.cardNumber ??
        "PBR-Compiled",
      grade: itemType === "box_set" ? "SEALED" : gradingFields!.gradeLabel,
      grader: itemType === "box_set" ? "SEALED" : gradingFields!.grader,
      purchasePrice: 0,
      currentValue: 0,
      sellingPrice: Number(sellingPrice),
      status: "listed",
      isHobbyOnly: false,
      images:
        photoSlots
          .filter((slot) => slot.previewUrl)
          .map((slot, index) => ({
            url: slot.previewUrl!,
            order: index + 1,
          })),
      condition: itemType === "box_set" ? "SEALED" : gradingFields!.condition,
      conditionDesc: conditionDesc || undefined,
    };

    window.dispatchEvent(
      new CustomEvent("global-asset-successfully-added", { detail: payload }),
    );

    toast.success("🏪 商品已成功錄入並直接上架交易所大盤");

    handleCloseAndReset();
  };

  const showListingAuthToggle =
    mode === "merch" && itemType === "card" && isRawCardListing;

  const listingAuthToggle = showListingAuthToggle ? (
    <div className="bg-[#17130f] border border-brand/20 rounded-xl p-4 space-y-2 animate-fadeIn">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-sans font-bold text-[#d4c4b7] text-[12.5px]">
            接受買家加購平台鑑定
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="shrink-0 text-[#8A8680] hover:text-brand"
                aria-label="平台鑑定託管說明"
              >
                <CircleHelp className="size-4" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs whitespace-pre-line text-left leading-relaxed"
              >
                <span className="font-bold block mb-1">
                  {LISTING_AUTH_SERVICE_TOOLTIP_TITLE}
                </span>
                {LISTING_AUTH_SERVICE_TOOLTIP_BODY}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          checked={acceptsBuyerAuth}
          onCheckedChange={setAcceptsBuyerAuth}
          className="data-checked:bg-brand data-unchecked:bg-[#39342f] shrink-0"
        />
      </div>
      <p className="text-[11px] text-text-secondary leading-relaxed">
        僅裸卡適用。已評級卡（PSA／CGC 等）無需平台複鑑；開啟後買家可選加購（HK$150
        由買家承擔）。
      </p>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-xs"
        onClick={handleCloseAndReset}
      />

      <div className="relative bg-[#2e2925] border border-[rgba(237,232,224,0.15)] rounded-2xl p-6 w-full max-w-md shadow-2xl text-left flex flex-col max-h-[92vh] overflow-hidden animate-scaleUp">
        <div className="font-sans font-bold text-xl text-brand mb-4">
          {displayMode}
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none pb-1 text-[13px]"
        >
          {/* Symmetrical Item-Type Sharding Switch Chassis */}
          {!sellPrefill ? (
          <div className="relative flex bg-[#17130f] rounded-xl p-1 border border-[rgba(237,232,224,0.08)] w-full max-w-xs mb-4 select-none mx-auto lg:mx-0">
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-[rgba(212,165,116,0.14)] border border-[rgba(212,165,116,0.22)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
              style={{
                width: "calc(50% - 4px)",
                transform:
                  itemType === "card"
                    ? "translateX(0)"
                    : "translateX(calc(100% + 4px))",
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (itemType === "card") return;
                setItemType("card");
                catalogSearch.invalidateResults();
              }}
              className={`relative flex-1 h-9 font-sans text-[13px] font-bold rounded-lg transition-colors z-10 ${
                itemType === "card"
                  ? "text-brand"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              單卡交易 (CARD)
            </button>
            <button
              type="button"
              onClick={() => {
                if (itemType === "box_set") return;
                setItemType("box_set");
                catalogSearch.invalidateResults();
              }}
              className={`relative flex-1 h-9 font-sans text-[13px] font-bold rounded-lg transition-colors z-10 ${
                itemType === "box_set"
                  ? "text-brand"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              密封盒組 (BOX/SET)
            </button>
          </div>
          ) : null}

          {sellPrefill ? (
            <p className="font-mono text-[11px] text-[#8A8680] leading-relaxed">
              卡牌與規格已從收藏庫帶入。請上傳 4–6 張實物相片並確認放售價格。
            </p>
          ) : null}

          {/* === 1. CARD QUERY CONVERGENCE (Both Modes Share This Unified Box) === */}
          {!sellPrefill ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[12px] text-[#d4c4b7] block">
                {itemType === "box_set" ? "盒組／禮盒名稱搜尋" : "卡牌編號 / 名稱搜尋"} <span className="text-warning">*</span>
              </label>
              {boxSetBadge}
            </div>
            <div className="relative">
              <div className="flex items-center bg-[#17130f] border border-white/5 rounded-xl h-10 overflow-hidden">
                <input
                  type="text"
                  required
                  placeholder={itemType === "box_set" ? "例：151 Booster Box 或 20th Anniversary Set" : "sv2a-182 或 Charizard ex SAR"}
                  value={catalogSearch.query}
                  onChange={(e) => catalogSearch.setQuery(e.target.value)}
                  className="flex-1 h-full bg-transparent px-3 font-sans text-[13px] text-[#eae1da] placeholder-[#50453b] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={catalogSearch.searchNow}
                  className="px-4 h-full font-mono text-[12px] text-brand hover:bg-[rgba(212,165,116,0.08)] transition-colors border-l border-white/5 cursor-pointer focus:outline-none"
                >
                  {catalogSearch.isSearching ? "..." : "搜尋"}
                </button>
              </div>

              {(catalogSearch.isSearching ||
                catalogSearch.error ||
                catalogSearch.results.length > 0) && (
                <div className="absolute z-50 top-full mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#26211C] shadow-lg">
                  {catalogSearch.isSearching && (
                    <p className="px-3 py-2 font-mono text-[11px] text-[#8A8680]">
                      搜尋中…
                    </p>
                  )}
                  {catalogSearch.error && (
                    <p className="px-3 py-2 font-mono text-[11px] text-warning">
                      {catalogSearch.error}
                    </p>
                  )}
                  {catalogSearch.results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectCatalogSuggestion(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[rgba(212,165,116,0.08)] border-b border-white/5 last:border-b-0"
                    >
                      <div className="relative w-14 h-[4.5rem] shrink-0 rounded-md overflow-hidden bg-[#17130f] border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          width={56}
                          height={72}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-[13px] text-[#eae1da] truncate">
                          {item.name}
                        </p>
                        <p className="font-mono text-[10px] text-[#8A8680] truncate mt-0.5">
                          {[
                            item.displayId,
                            item.rarity,
                            item.pokemonStage,
                            item.cardNumber,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </button>
                  ))}
                  {catalogSearch.hasMore && (
                    <p className="px-3 py-2 font-mono text-[10px] text-[#8A8680] border-t border-white/5 leading-relaxed">
                      顯示最相關的 {catalogSearch.results.length} 筆，共{" "}
                      {catalogSearch.total.toLocaleString()} 筆符合
                      {catalogSearch.total > 50
                        ? " — 請輸入更精確的編號或名稱以縮小範圍"
                        : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          ) : null}

          {catalogSearch.selected && itemType === "card" && (
            <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-[rgba(212,165,116,0.06)] p-3">
              <div className="relative w-14 h-[4.5rem] shrink-0 rounded-md overflow-hidden bg-[#17130f] border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={catalogSearch.selected.imageUrl}
                  alt={catalogSearch.selected.name}
                  width={56}
                  height={72}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[13px] text-[#eae1da] font-bold truncate">
                  {catalogSearch.selected.name}
                </p>
                <p className="font-mono text-[11px] text-brand mt-0.5 truncate">
                  {catalogSearch.selected.displayId ??
                    catalogSearch.selected.cardNumber ??
                    "—"}
                </p>
                {catalogSearch.selected.rarity && (
                  <p className="font-mono text-[10px] text-[#8A8680] mt-0.5 truncate">
                    {catalogSearch.selected.rarity}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* === 2. OPTIONAL EXPANSION SET === */}
          {!sellPrefill ? (
          <div className="space-y-1.5">
            <label className="font-sans font-bold text-[#d4c4b7]">
              擴充包系列{" "}
              <span className="text-text-disabled font-normal text-[11px]">
                (選填)
              </span>
            </label>
            <input
              type="text"
              placeholder="擴充包系列 (選填)"
              value={set}
              onChange={(e) => setSet(e.target.value)}
              className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-[#eae1da] placeholder-[#50453b] focus:outline-none"
            />
          </div>
          ) : null}

          {/* === 3. UNIFIED GRADING SELECT === */}
          {itemType === "card" && !sellPrefill && (
            <div className="space-y-1.5 bg-[#1e1a17] p-3.5 rounded-xl border border-white/[0.04]">
              <label className="font-mono text-[11px] text-[#d4c4b7]">
                鑑定／品相
              </label>
              <Select
                value={selectedGradingId}
                onValueChange={(val) =>
                  handleGradingChange(val ?? DEFAULT_GRADING_OPTION_ID)
                }
              >
                <SelectTrigger className="w-full h-10 bg-[#17130f] border border-white/5 rounded-lg px-2 text-[#eae1da] focus:ring-0 text-[12px]">
                  <SelectValue placeholder="選擇鑑定或裸卡品相" />
                </SelectTrigger>
                <SelectContent className="bg-[#26211C] border border-white/10 text-[#eae1da] max-h-72">
                  {GRADING_OPTION_GROUPS.map((group) => (
                    <SelectGroup key={group.key}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {getGradingOptionsByGroup(group.key).map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {listingAuthToggle}

          {/* === 4. PHOTO UPLOAD SECTION === */}
          {mode === "merch" ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-sans font-bold text-[#d4c4b7]">
                實體品相相片{" "}
                {itemType === "box_set"
                  ? `(必須至少 1 張)`
                  : `(必須 ${LISTING_IMAGE_MIN}–${LISTING_IMAGE_MAX} 張)`}{" "}
                <span className="text-brand">*</span>
              </label>
              <span className="font-mono text-[9px] text-[#8A8680] uppercase tracking-wider">
                {itemType === "card"
                  ? `${filledPhotoCount}/${LISTING_IMAGE_MAX}`
                  : `Max ${LISTING_IMAGE_MAX} Photos`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {photoSlots.map((photo, i) => {
                  const isRequired =
                    itemType === "box_set" ? i < 1 : i < LISTING_IMAGE_MIN;
                  return (
                    <div key={i} className="flex flex-col">
                      <div
                        className={`relative aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                          photo.previewUrl
                            ? "border-brand/30 bg-[#17130f]"
                            : isRequired
                              ? "border-brand/40 bg-[rgba(212,165,116,0.06)]"
                              : "border-[rgba(237,232,224,0.12)] bg-[#17130f] hover:border-brand/30"
                        }`}
                        onClick={() => openPhotoPicker(i)}
                      >
                        {photo.previewUrl ? (
                          <>
                            <Image
                              src={photo.previewUrl}
                              alt={`實體照 ${i + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhotoSlot(i);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white hover:bg-brand hover:text-[#1A1612] flex items-center justify-center font-sans text-[10px] font-black cursor-pointer transition-colors focus:outline-none"
                            >
                              ✕
                            </button>
                            <span className="absolute bottom-1 left-1 font-mono text-[8px] text-white/80 bg-black/50 px-1 rounded">
                              更換
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={isRequired ? "#d4a574" : "#50453b"}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span className="font-mono text-[9px] text-text-disabled mt-1">
                              {isRequired ? "必填" : "選填"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          ) : null}

          {/* === 5. MODE-SPECIFIC VALUE FIELDS === */}
          {mode === "hobby" ? (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="font-sans font-bold text-[#d4c4b7]">
                入手成本 (HK$)
              </label>
              <input
                type="number"
                placeholder="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-brand focus:outline-none font-mono"
              />
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-sans font-bold text-[#d4c4b7]">
                    詳細品相描述{" "}
                    <span className="text-text-disabled font-normal text-[11px]">
                      選填
                    </span>
                  </label>
                  <span className="font-mono text-[10px] text-[#8A8680]">
                    {conditionDesc.length}/{LISTING_DESCRIPTION_MAX}
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={LISTING_DESCRIPTION_MAX}
                  placeholder="詳細描述卡面狀況、印刷品質、角落細節等..."
                  value={conditionDesc}
                  onChange={(e) => setConditionDesc(e.target.value)}
                  className="bg-[#17130f] border border-white/5 rounded-xl text-[#eae1da] px-3 py-2.5 font-sans text-[13px] w-full focus:outline-none placeholder-[#50453b] resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-sans font-bold text-[#d4a574] flex items-center gap-1">
                  💰 交易所掛牌放售售價 (Selling Price) *
                </label>
                <div className="flex items-center h-10 bg-[#17130f] border border-white/5 rounded-xl overflow-hidden focus-within:border-brand/40 transition-colors">
                  <span className="px-3.5 font-mono text-[12px] font-black text-[#8a8680] bg-[#26211C] border-r border-white/5 h-full flex items-center shrink-0">
                    HK$
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="一口價放售金額..."
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="flex-1 h-full bg-transparent px-3 font-mono text-[13px] text-brand focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Submission Buttons */}
          <div className="flex gap-2 pt-3 shrink-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 bg-[#d4a574] hover:bg-[#e8b896] disabled:opacity-60 disabled:cursor-not-allowed text-[#1A1612] font-sans font-black rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-md focus:outline-none"
            >
              {isSubmitting
                ? "上載中…"
                : sellPrefill
                  ? "🚀 確認上架發售"
                  : mode === "hobby"
                    ? "★ 收錄至私藏愛好"
                    : "🚀 立即發佈商品上架"}
            </button>
            <button
              type="button"
              onClick={handleCloseAndReset}
              className="px-4 h-11 bg-transparent border border-white/10 text-[#d4c4b7] font-sans font-bold rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 快捷全域派發器
export const triggerGlobalAddAssetModal = (
  defaultMode: "hobby" | "merch" = "hobby",
) => {
  useUIStore.getState().openAddAssetModal({ mode: defaultMode });
};

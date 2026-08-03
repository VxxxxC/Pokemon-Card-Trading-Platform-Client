"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { toast } from "sonner";
import { addToCollection } from "@/app/actions/collection";
import { submitCardListingWithProgress } from "@/lib/listings/submit-card-listing";
import { submitSealedListingWithProgress } from "@/lib/listings/submit-sealed-listing";
import {
  CollectionAddAfterListingDialog,
  type CollectionAddAfterListingPayload,
} from "@/app/components/shared/CollectionAddAfterListingDialog";
import { ImageViewer } from "@/app/components/shared/ImageViewer";
import { useIsMemberPersonaActive } from "@/app/lib/hooks/useIsMemberPersonaActive";
import { MEMBER_PERSONA_FEATURES_BLOCKED_ERROR } from "@/lib/auth/member-persona-features";
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
  isRawGradingOptionId,
} from "@/lib/grading/options";
import type { ListingImage } from "@/lib/listings/images";
import {
  LISTING_IMAGE_MAX,
  LISTING_PHOTO_SLOT_LABELS,
} from "@/lib/listings/images";
import {
  LISTING_DESCRIPTION_MAX,
  validateCreateCardListing,
  validateCreateSealedListing,
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
import {
  catalogItemKindFromType,
  defaultSealedProductScore,
  type SealedProductScore,
} from "@/lib/catalog/item-kind";
import type { CatalogType } from "@/lib/constants/commerce";
import { CircleHelp } from "lucide-react";
import type { CardInstance, SKUGroup } from "@/app/components/merchant/InventoryAccordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bunnyObjectKeyFromCdnUrl } from "@/lib/storage/bunny";
import { invalidateMarketplaceListingDetailCache } from "@/app/lib/hooks/useMarketplaceListingDetail";
import { useUIStore } from "@/app/store/useUIStore";
import type { SellFromCollectionPrefill } from "@/app/store/useUIStore";

// ─── Shared Data Contracts ───────────────────────────────────────────────────

export interface GlobalAssetPayload {
  id: string;
  name: string;
  set: string;
  cardNo: string;
  grade: string;
  grader: "PSA" | "BGS" | "CGC" | "RAW" | "OTHER" | string;
  purchasePrice: number;
  currentValue: number;
  sellingPrice: number;
  status: "holding" | "listed" | "grading";
  isHobbyOnly: boolean;
  images: string[] | ListingImage[];
  condition?: string;
  conditionDesc?: string;
  photosRemark?: string[];
}

type PhotoSlot = {
  previewUrl: string | null;
  file: File | null;
  description: string;
  existingUrl?: string | null;
  existingObjectKey?: string | null;
};

// ─── Props ────────────────────────────────────────────────────────────────────

type CreateListingFormModalProps = {
  mode: "create";
};

type EditListingFormModalProps = {
  mode: "edit";
  isOpen: boolean;
  onClose: () => void;
  sku: Pick<SKUGroup, "cardName" | "cardNo">;
  item: CardInstance;
  inventoryContext?: "merchant" | "member";
  onSaved?: () => void;
};

export type ListingFormModalProps =
  | CreateListingFormModalProps
  | EditListingFormModalProps;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createEmptyPhotoSlots(): PhotoSlot[] {
  return Array.from({ length: LISTING_IMAGE_MAX }, () => ({
    previewUrl: null,
    file: null,
    description: "",
  }));
}

function revokePhotoSlots(slots: PhotoSlot[]) {
  for (const slot of slots) {
    if (slot.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(slot.previewUrl);
    }
  }
}

function buildEditPhotoSlots(images: ListingImage[]): PhotoSlot[] {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  return Array.from({ length: LISTING_IMAGE_MAX }, (_, index) => {
    const image = sorted[index];
    const slotLabel = LISTING_PHOTO_SLOT_LABELS[index] ?? `實體照 ${index + 1}`;
    return {
      previewUrl: image?.url ?? null,
      file: null,
      existingUrl: image?.url ?? null,
      existingObjectKey:
        image?.url != null ? bunnyObjectKeyFromCdnUrl(image.url) : null,
      description: image?.remark?.trim() || slotLabel,
    };
  });
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
    type: (prefill.catalog.catalogType ?? "single_card") as CatalogType,
    rarity: prefill.catalog.rarity ?? null,
    pokemonStage: null,
  };
}

function catalogSelectionError(itemType: "card" | "box_set"): string {
  return itemType === "box_set"
    ? "請從搜尋結果中選擇商品"
    : "請從搜尋結果中選擇一張卡牌";
}

function formatDisplayTitle(
  mode: "create" | "edit",
  addAssetMode: "hobby" | "merch",
  itemType: "card" | "box_set",
  hasPrefill: boolean,
): string {
  if (mode === "edit") return "卡牌實物詳情與編輯";
  if (hasPrefill) return "上架出售收藏";
  if (addAssetMode === "hobby") return "收藏愛好";
  return itemType === "box_set" ? "新增密封盒組商品" : "新增單卡商品";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ListingFormModal(props: ListingFormModalProps) {
  const { mode } = props;
  const isCreate = mode === "create";
  const isEdit = mode === "edit";

  const editProps = isEdit ? props : undefined;

  const createIsOpen = useUIStore((state) => state.isAddAssetOpen);
  const addAssetMode = useUIStore((state) => state.addAssetMode);
  const sellPrefill = useUIStore((state) => state.addAssetSellPrefill);
  const sellerPersona = useUIStore((state) => state.addAssetSellerPersona);
  const closeCreateModal = useUIStore((state) => state.closeAddAssetModal);

  const isOpen = isEdit ? editProps!.isOpen : createIsOpen;
  const onClose = isEdit ? editProps!.onClose : closeCreateModal;
  const inventoryContext = isEdit ? editProps?.inventoryContext ?? "member" : undefined;

  const isMemberPersonaActive = useIsMemberPersonaActive();
  const listingSubmitPhase = useListingSubmitStore((state) => state.phase);
  const listingSubmitOpen = useListingSubmitStore((state) => state.isOpen);
  const isSubmitting =
    listingSubmitOpen &&
    listingSubmitPhase !== "idle" &&
    listingSubmitPhase !== "error";

  // ── Create-mode state ───────────────────────────────────────────────────────
  const [itemType, setItemType] = useState<"card" | "box_set">("card");
  const [setCode, setSetCode] = useState("");
  const [collectionAddPrompt, setCollectionAddPrompt] =
    useState<CollectionAddAfterListingPayload | null>(null);
  const [sealState, setSealState] = useState<SealedProductScore>(
    defaultSealedProductScore(),
  );

  // ── Edit-mode state ─────────────────────────────────────────────────────────
  const [isActive, setIsActive] = useState(false);

  // ── Shared state ────────────────────────────────────────────────────────────
  const [price, setPrice] = useState("");
  const [extraShippingFee, setExtraShippingFee] = useState("");
  const [gradingId, setGradingId] = useState(DEFAULT_GRADING_OPTION_ID);
  const [conditionDesc, setConditionDesc] = useState("");
  const [useAuthentication, setUseAuthentication] = useState(false);
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(createEmptyPhotoSlots);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  // ── Image viewer (edit mode only) ───────────────────────────────────────────
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const catalogItemType = itemType === "box_set" ? "box_set" : "card";
  const catalogSearch = useProductCatalogSearch(catalogItemType, {
    enabled: isCreate && isOpen,
  });

  const selectedGrading = useMemo(
    () => getGradingOption(gradingId),
    [gradingId],
  );
  const isRawSelected = isRawGradingOption(selectedGrading);
  const isMerch = isEdit || addAssetMode === "merch";
  const showAuthToggle = isCreate
    ? isMerch && itemType === "card" && isRawSelected
    : isRawSelected;
  const showPhotoGrid = isMerch;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoSlotsRef = useRef<PhotoSlot[]>(photoSlots);

  useEffect(() => {
    photoSlotsRef.current = photoSlots;
  }, [photoSlots]);

  useEffect(() => {
    return () => {
      revokePhotoSlots(photoSlotsRef.current);
    };
  }, []);

  // ── Reset / initialise on open ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (isCreate) {
      if (sellPrefill) {
        const suggestion = suggestionFromSellPrefill(sellPrefill);
        catalogSearch.selectSuggestion(suggestion);
        setItemType(
          sellPrefill.itemKind ?? catalogItemKindFromType(suggestion.type),
        );
        setSetCode(sellPrefill.catalog.setCode);
        setGradingId(sellPrefill.gradingOptionId);
        setSealState(sellPrefill.sealState ?? defaultSealedProductScore());
        setPrice(String(sellPrefill.sellingPrice));
        setUseAuthentication(
          isRawGradingOptionId(sellPrefill.gradingOptionId),
        );
      } else {
        catalogSearch.clearSearch();
        setItemType("card");
        setSetCode("");
        setGradingId(DEFAULT_GRADING_OPTION_ID);
        setSealState(defaultSealedProductScore());
        setPrice("");
        setUseAuthentication(false);
      }
      setExtraShippingFee("");
      setConditionDesc("");
      setPhotoSlots(createEmptyPhotoSlots());
      setActiveSlotIndex(null);
      setCollectionAddPrompt(null);
    } else if (isEdit && editProps) {
      const { item } = editProps;
      setPrice(String(item.askPrice));
      setExtraShippingFee(
        item.extraShippingFee != null && item.extraShippingFee > 0
          ? String(item.extraShippingFee)
          : "",
      );
      setGradingId(item.gradingOptionId || DEFAULT_GRADING_OPTION_ID);
      setConditionDesc(item.conditionDesc);
      setIsActive(item.status === "active");
      setUseAuthentication(item.useAuthentication ?? true);
      setPhotoSlots(buildEditPhotoSlots(item.images));
      setActiveSlotIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, sellPrefill, addAssetMode, editProps?.item.id]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleItemTypeChange = (nextItemType: "card" | "box_set") => {
    if (itemType === nextItemType) return;
    setItemType(nextItemType);
    catalogSearch.invalidateResults();
    if (nextItemType === "box_set") {
      setGradingId(DEFAULT_GRADING_OPTION_ID);
    }
  };

  const handleSelectCatalogSuggestion = (
    suggestion: ProductCatalogSuggestion,
  ) => {
    catalogSearch.selectSuggestion(suggestion);
    setSetCode(suggestion.setCode);
  };

  const handleOpenPhotoPicker = (slotIndex: number) => {
    setActiveSlotIndex(slotIndex);
    fileInputRef.current?.click();
  };

  const handleRemovePhotoSlot = (indexToRemove: number) => {
    setPhotoSlots((prev) => {
      const next = [...prev];
      const existing = next[indexToRemove];
      if (existing?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(existing.previewUrl);
      }
      next[indexToRemove] = {
        previewUrl: null,
        file: null,
        description: "",
        existingUrl: null,
        existingObjectKey: null,
      };
      return next;
    });
  };

  const applyFilesToPhotoSlots = (
    files: File[],
    startIndex: number,
  ): { assigned: number; skipped: number; fileErrors: string[] } => {
    const next = [...photoSlots];
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
      if (existing?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(existing.previewUrl);
      }

      const slotLabel = LISTING_PHOTO_SLOT_LABELS[slotIndex] ?? `實體照 ${slotIndex + 1}`;
      next[slotIndex] = {
        ...existing,
        file,
        previewUrl: URL.createObjectURL(file),
        existingUrl: null,
        existingObjectKey: null,
        description: existing?.description?.trim() || slotLabel,
      };
      assigned += 1;
      slotIndex += 1;
    }

    setPhotoSlots(next);

    for (const message of fileErrors) {
      toast.error(`⚠️ ${message}`);
    }

    return { assigned, skipped, fileErrors };
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (files.length === 0 || activeSlotIndex === null) return;

    if (isCreate) {
      const startIndex = activeSlotIndex;
      const { assigned, skipped } = applyFilesToPhotoSlots(files, startIndex);
      if (assigned > 0 && skipped > 0) {
        toast.message(
          `已加入 ${assigned} 張相片，${skipped} 張未加入（上限或格式不符）`,
        );
      }
    } else {
      const file = files[0];
      if (!file) return;
      const fileError = validateImageFile(file);
      if (fileError) {
        toast.error(`⚠️ ${fileError}`);
        return;
      }
      const slotIndex = activeSlotIndex;
      setPhotoSlots((prev) => {
        const next = [...prev];
        const existing = next[slotIndex];
        if (existing?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(existing.previewUrl);
        }
        next[slotIndex] = {
          ...existing,
          file,
          previewUrl: URL.createObjectURL(file),
          existingUrl: null,
          existingObjectKey: null,
        };
        return next;
      });
    }

    setActiveSlotIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isCreate && addAssetMode === "hobby") {
      if (!isMemberPersonaActive) {
        toast.error(MEMBER_PERSONA_FEATURES_BLOCKED_ERROR);
        return;
      }
      if (!catalogSearch.selected) {
        toast.error(catalogSelectionError(itemType));
        return;
      }
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        toast.error("⚠️ 請輸入有效的入手成本");
        return;
      }
      const result = await addToCollection({
        productId: catalogSearch.selected.id,
        gradingOptionId: gradingId,
        purchasePrice: parsedPrice,
        sealState: itemType === "box_set" ? sealState : undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        itemType === "box_set"
          ? "★ 已成功收錄密封盒組至您的私藏愛好清單"
          : "★ 已成功收錄進您的私藏愛好清單",
      );
      window.dispatchEvent(new CustomEvent("collection-should-refresh"));
      onClose();
      return;
    }

    if (isCreate && addAssetMode === "merch" && itemType === "box_set") {
      const imageFiles = photoSlots
        .map((slot) => slot.file)
        .filter((file): file is File => file !== null);

      const validationError = validateCreateSealedListing(
        {
          productId: catalogSearch.selected?.id ?? "",
          price: Number(price),
          sellerDescription: conditionDesc || undefined,
        },
        imageFiles,
      );
      if (validationError) {
        toast.error(`⚠️ ${validationError}`);
        return;
      }
      if (!catalogSearch.selected) {
        toast.error(catalogSelectionError(itemType));
        return;
      }

      const photosRemark = photoSlots
        .map((slot, originalIdx) => {
          if (!slot.file) return null;
          const defaultDesc = `實體照 ${originalIdx + 1}`;
          return slot.description?.trim() || defaultDesc;
        })
        .filter((remark): remark is string => remark !== null);

      const result = await submitSealedListingWithProgress({
        productId: catalogSearch.selected.id,
        price: Number(price),
        sellerDescription: conditionDesc || undefined,
        sourceCollectionId: sellPrefill?.collectionId,
        sellerPersona,
        imageFiles,
        photosRemark,
        sealState,
        extraShippingFee:
          sellerPersona === "merchant" && extraShippingFee.trim()
            ? Number(extraShippingFee)
            : undefined,
      });

      if (!result.success) return;

      const hadSellPrefill = Boolean(sellPrefill);
      invalidateMarketplaceListingDetailCache();
      window.dispatchEvent(new CustomEvent("inventory-should-refresh"));
      if (hadSellPrefill) {
        window.dispatchEvent(new CustomEvent("collection-should-refresh"));
      }

      toast.success(
        hadSellPrefill
          ? "🏛️ 密封盒組已成功上架發售"
          : "🏪 密封盒組已成功錄入並直接上架交易所大盤",
      );
      onClose();

      if (!hadSellPrefill && catalogSearch.selected && isMemberPersonaActive) {
        setCollectionAddPrompt({
          productId: catalogSearch.selected.id,
          productName: catalogSearch.selected.name,
          itemKind: "box_set",
          sealState,
        });
      }
      return;
    }

    if (isCreate && addAssetMode === "merch" && itemType === "card") {
      const imageFiles = photoSlots
        .map((slot) => slot.file)
        .filter((file): file is File => file !== null);

      const validationError = validateCreateCardListing(
        {
          productId: catalogSearch.selected?.id ?? "",
          gradingOptionId: gradingId,
          price: Number(price),
          sellerDescription: conditionDesc || undefined,
        },
        imageFiles,
      );
      if (validationError) {
        toast.error(`⚠️ ${validationError}`);
        return;
      }
      if (!catalogSearch.selected) {
        toast.error(catalogSelectionError(itemType));
        return;
      }

      const photosRemark = photoSlots
        .map((slot, originalIdx) => {
          if (!slot.file) return null;
          const slotLabel = LISTING_PHOTO_SLOT_LABELS[originalIdx] ?? null;
          const defaultDesc = slotLabel || `實體照 ${originalIdx + 1}`;
          return slot.description?.trim() || defaultDesc;
        })
        .filter((remark): remark is string => remark !== null);

      const result = await submitCardListingWithProgress({
        mode: "create",
        productId: catalogSearch.selected.id,
        gradingOptionId: gradingId,
        price: Number(price),
        sellerDescription: conditionDesc || undefined,
        useAuthentication: isRawSelected ? useAuthentication : false,
        sourceCollectionId: sellPrefill?.collectionId,
        sellerPersona,
        imageFiles,
        photosRemark,
        extraShippingFee:
          sellerPersona === "merchant" && extraShippingFee.trim()
            ? Number(extraShippingFee)
            : undefined,
      });

      if (!result.success) return;

      const hadSellPrefill = Boolean(sellPrefill);
      const gradingFields = gradingOptionToFields(selectedGrading);

      const payload: GlobalAssetPayload = {
        id: result.data.listingId,
        name: catalogSearch.selected.name,
        set: setCode || catalogSearch.selected.setCode,
        cardNo:
          catalogSearch.selected.displayId ??
          catalogSearch.selected.cardNumber ??
          "",
        grade: gradingFields.gradeLabel,
        grader: gradingFields.grader,
        purchasePrice: 0,
        currentValue: 0,
        sellingPrice: Number(price),
        status: "listed",
        isHobbyOnly: false,
        images: result.data.images,
        condition: gradingFields.condition,
        conditionDesc: conditionDesc || undefined,
        photosRemark: photoSlots
          .map((slot, originalIdx) => {
            if (!slot.previewUrl) return null;
            const slotLabel = LISTING_PHOTO_SLOT_LABELS[originalIdx] ?? null;
            const defaultDesc = slotLabel || `實體照 ${originalIdx + 1}`;
            return slot.description?.trim() || defaultDesc;
          })
          .filter((remark): remark is string => remark !== null),
      };

      invalidateMarketplaceListingDetailCache();
      window.dispatchEvent(
        new CustomEvent("global-asset-successfully-added", { detail: payload }),
      );
      window.dispatchEvent(new CustomEvent("inventory-should-refresh"));
      if (hadSellPrefill) {
        window.dispatchEvent(new CustomEvent("collection-should-refresh"));
      }

      toast.success(
        hadSellPrefill
          ? "🏛️ 收藏品已成功上架發售"
          : "🏪 商品已成功錄入並直接上架交易所大盤",
      );
      onClose();

      if (!hadSellPrefill && catalogSearch.selected && isMemberPersonaActive) {
        setCollectionAddPrompt({
          productId: catalogSearch.selected.id,
          gradingOptionId: gradingId,
          productName: catalogSearch.selected.name,
        });
      }
      return;
    }

    if (isEdit && editProps) {
      const { item, sku, onSaved } = editProps;
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        toast.error("⚠️ 請輸入有效的售價");
        return;
      }
      if (conditionDesc.length > LISTING_DESCRIPTION_MAX) {
        toast.error(`品相描述不可超過 ${LISTING_DESCRIPTION_MAX} 字`);
        return;
      }
      const missingSlot = photoSlots.find((slot) => !slot.previewUrl);
      if (missingSlot) {
        toast.error("必須上載全部 6 張卡牌相片（正面、背面及四個角）");
        return;
      }

      const result = await submitCardListingWithProgress({
        mode: "edit",
        listingId: item.id,
        gradingOptionId: gradingId,
        price: parsedPrice,
        sellerDescription: conditionDesc.trim() || undefined,
        isActive,
        useAuthentication: isRawSelected ? useAuthentication : false,
        sellerPersona: inventoryContext === "merchant" ? "merchant" : undefined,
        extraShippingFee:
          inventoryContext === "merchant" && extraShippingFee.trim()
            ? Number(extraShippingFee)
            : inventoryContext === "merchant"
              ? 0
              : undefined,
        imageSlots: photoSlots.map((slot) => ({
          file: slot.file,
          existingUrl: slot.existingUrl ?? slot.previewUrl ?? undefined,
          existingObjectKey: slot.existingObjectKey ?? undefined,
          remark: slot.description.trim() || undefined,
        })),
      });

      if (!result.success) return;

      toast.success(`「${sku.cardName} · ${item.grade}」修改已儲存`);
      onClose();
      onSaved?.();
      invalidateMarketplaceListingDetailCache();
      window.dispatchEvent(new CustomEvent("inventory-should-refresh"));
    }
  };

  // ── Viewer helpers (edit mode only) ──────────────────────────────────────────
  const viewerImages = useMemo(
    () =>
      photoSlots
        .map((slot) => slot.previewUrl)
        .filter((url): url is string => Boolean(url)),
    [photoSlots],
  );

  const viewerRemarks = useMemo(
    () => photoSlots.map((slot) => slot.description),
    [photoSlots],
  );

  const openViewerAt = (slotIndex: number) => {
    if (!photoSlots[slotIndex]?.previewUrl) return;
    const visibleIndex =
      photoSlots
        .slice(0, slotIndex + 1)
        .filter((slot) => slot.previewUrl).length - 1;
    if (visibleIndex < 0) return;
    setViewerIndex(visibleIndex);
    setIsViewerOpen(true);
  };

  // ── Derived UI state ────────────────────────────────────────────────────────
  const filledPhotoCount = useMemo(
    () => photoSlots.filter((slot) => slot.file || slot.existingUrl).length,
    [photoSlots],
  );

  const isSlotRequired = (index: number): boolean => {
    if (!showPhotoGrid) return false;
    if (isEdit) return true;
    if (itemType === "card") return true;
    return index < 1; // box_set first photo required
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderAuthToggle = () => {
    if (!showAuthToggle) return null;
    return (
      <div className="bg-[#17130f] border border-white/5 rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-sans text-[13px] font-semibold text-text-primary">
              開放官方中介鑑定
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
          <span className="font-sans text-[11px] text-text-secondary mt-0.5 leading-relaxed">
            允許買家付費加購 HKCardVault 官方第三方專業鑑定與託管交收
          </span>
        </div>
        <Switch
          checked={useAuthentication}
          onCheckedChange={setUseAuthentication}
          aria-label="開放官方中介鑑定"
          className="data-checked:bg-brand data-unchecked:bg-[#39342f] shrink-0"
        />
      </div>
    );
  };

  const renderGradingSelect = () => {
    if (isCreate && itemType === "box_set") return null;
    return (
      <div className="bg-[#17130f] border border-white/5 rounded-xl px-3.5 py-2.5 flex flex-col">
        <label className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1">
          {isEdit ? "鑑定等級" : "鑑定／品相"}
        </label>
        <Select
          value={gradingId}
          onValueChange={(value) =>
            setGradingId(value ?? DEFAULT_GRADING_OPTION_ID)
          }
        >
          <SelectTrigger className="w-full h-10 border border-white/10 bg-[#120F0C] rounded-xl px-3 text-[13px] font-bold text-text-primary focus:ring-1 focus:ring-brand/40">
            <SelectValue placeholder="選擇鑑定或裸卡品相" />
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            sideOffset={4}
            className="z-[999] w-(--anchor-width) max-h-60 overflow-y-auto bg-[#26211C] border border-[rgba(237,232,224,0.15)] text-[#eae1da] shadow-2xl rounded-xl"
          >
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
    );
  };

  const renderSealedState = () => {
    if (!isCreate || itemType === "card") return null;
    return (
      <div className="bg-[#17130f] border border-white/5 rounded-xl px-3.5 py-2.5 flex flex-col">
        <label className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1">
          密封狀態
        </label>
        <div className="flex gap-2">
          {(
            [
              { value: "SEALED" as const, label: "密封" },
              { value: "UNSEALED" as const, label: "已開封" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSealState(value)}
              className={`flex-1 h-9 rounded-lg border font-mono text-[12px] transition-colors ${
                sealState === value
                  ? "border-brand bg-[rgba(212,165,116,0.12)] text-brand"
                  : "border-white/10 bg-[#120F0C] text-[#d4c4b7]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderPhotoGrid = () => {
    if (!showPhotoGrid) return null;
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-mono text-[11px] text-text-disabled uppercase tracking-wider">
            {isCreate && itemType === "box_set"
              ? `實物相片 (至少 1 張)`
              : `實物照片 (必須 ${LISTING_IMAGE_MAX} 張)`}
            <span className="text-warning"> *</span>
          </p>
          <span className="font-mono text-[9px] text-[#8A8680] uppercase tracking-wider">
            {isCreate && itemType === "box_set"
              ? `${filledPhotoCount}/${LISTING_IMAGE_MAX}`
              : `${filledPhotoCount}/${LISTING_IMAGE_MAX}`}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {photoSlots.map((slot, index) => {
            const required = isSlotRequired(index);
            const slotLabel =
              LISTING_PHOTO_SLOT_LABELS[index] ?? `實體照 ${index + 1}`;
            const hasPreview = Boolean(slot.previewUrl);

            return (
              <div key={index} className="flex flex-col">
                <div
                  className={`relative aspect-[3/4] rounded-xl border overflow-hidden bg-[#17130f] ${
                    hasPreview
                      ? "border-white/10"
                      : required
                        ? "border-brand/40 border-dashed bg-[rgba(212,165,116,0.06)]"
                        : "border-[rgba(237,232,224,0.12)] border-dashed"
                  }`}
                >
                  {hasPreview ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          isEdit ? openViewerAt(index) : handleOpenPhotoPicker(index)
                        }
                        className={`absolute inset-0 ${isEdit ? "cursor-zoom-in" : "cursor-pointer"}`}
                        aria-label={`預覽${slotLabel}`}
                      >
                        <Image
                          src={slot.previewUrl!}
                          alt={slotLabel}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          handleRemovePhotoSlot(index);
                        }}
                        className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-black/80 text-white hover:bg-brand hover:text-[#1A1612] flex items-center justify-center font-sans text-[10px] font-black transition-colors"
                      >
                        ✕
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPhotoPicker(index)}
                        className="absolute bottom-1 right-1 z-10 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9px] text-brand"
                      >
                        更換
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenPhotoPicker(index)}
                      className="flex h-full w-full flex-col items-center justify-center gap-1"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={required ? "#d4a574" : "#50453b"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span className="font-mono text-[9px] text-text-disabled">
                        {required ? "必填" : "選填"}
                      </span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={slot.description}
                  onChange={(evt) => {
                    const value = evt.target.value;
                    setPhotoSlots((prev) =>
                      prev.map((entry, idx) =>
                        idx === index ? { ...entry, description: value } : entry,
                      ),
                    );
                  }}
                  placeholder={slotLabel}
                  className="mt-1 w-full rounded-lg border border-white/5 bg-[#111009] px-1.5 py-1 text-center font-sans text-[11px] text-text-primary placeholder-[#8A8680] focus:border-brand/40 focus:outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCatalogSection = () => {
    if (!isCreate) return null;
    if (sellPrefill) {
      return (
        <p className="font-mono text-[11px] text-[#8A8680] leading-relaxed">
          卡牌與規格已從收藏庫帶入。請上傳實物相片並確認放售價格。
        </p>
      );
    }

    return (
      <>
        {!sellPrefill && (
          <div className="relative flex bg-[#17130f] rounded-xl p-1 border border-[rgba(237,232,224,0.08)] w-full max-w-xs select-none">
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
              onClick={() => handleItemTypeChange("card")}
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
              onClick={() => handleItemTypeChange("box_set")}
              className={`relative flex-1 h-9 font-sans text-[13px] font-bold rounded-lg transition-colors z-10 ${
                itemType === "box_set"
                  ? "text-brand"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              密封盒組 (BOX/SET)
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="font-mono text-[12px] text-[#d4c4b7] block">
            {itemType === "box_set"
              ? "盒組／禮盒名稱搜尋"
              : "卡牌編號 / 名稱搜尋"}{" "}
            <span className="text-warning">*</span>
          </label>
          <div className="relative">
            <div className="flex items-center bg-[#17130f] border border-white/5 rounded-xl h-10 overflow-hidden">
              <input
                type="text"
                required
                placeholder={
                  itemType === "box_set"
                    ? "例：151 Booster Box、20th Anniversary Set 或 4549659123456"
                    : "sv2a-182 或 Charizard ex SAR"
                }
                value={catalogSearch.query}
                onChange={(evt) => catalogSearch.setQuery(evt.target.value)}
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

        {catalogSearch.selected && (
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
                {itemType === "box_set"
                  ? catalogSearch.selected.setCode || "—"
                  : catalogSearch.selected.displayId ??
                    catalogSearch.selected.cardNumber ??
                    "—"}
              </p>
              {itemType === "card" && catalogSearch.selected.rarity && (
                <p className="font-mono text-[10px] text-[#8A8680] mt-0.5 truncate">
                  {catalogSearch.selected.rarity}
                </p>
              )}
            </div>
          </div>
        )}

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
            value={setCode}
            onChange={(evt) => setSetCode(evt.target.value)}
            className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-[#eae1da] placeholder-[#50453b] focus:outline-none"
          />
        </div>
      </>
    );
  };

  const renderPriceField = () => {
    if (isCreate && addAssetMode === "hobby") {
      return (
        <div className="space-y-1.5 animate-fadeIn">
          <label className="font-sans font-bold text-[#d4c4b7]">
            入手成本 (HK$)
          </label>
          <input
            type="number"
            placeholder="0"
            value={price}
            onChange={(evt) => setPrice(evt.target.value)}
            className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-brand focus:outline-none font-mono"
          />
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <label className="font-sans font-bold text-[#d4a574] flex items-center gap-1">
          {isEdit ? "售價 (HK$)" : "💰 交易所掛牌放售售價 (Selling Price) *"}
        </label>
        <div className="flex items-center h-10 bg-[#17130f] border border-white/5 rounded-xl overflow-hidden focus-within:border-brand/40 transition-colors">
          <span className="px-3.5 font-mono text-[12px] font-black text-[#8a8680] bg-[#26211C] border-r border-white/5 h-full flex items-center shrink-0">
            HK$
          </span>
          <input
            type="number"
            required
            min={1}
            placeholder={isEdit ? "" : "一口價放售金額..."}
            value={price}
            onChange={(evt) => setPrice(evt.target.value)}
            className="flex-1 h-full bg-transparent px-3 font-mono text-[13px] text-brand focus:outline-none font-bold"
          />
        </div>
      </div>
    );
  };

  const renderExtraShippingFee = () => {
    const showExtraShippingFee = isEdit
      ? inventoryContext === "merchant"
      : isMerch && sellerPersona === "merchant";
    if (!showExtraShippingFee) return null;
    return (
      <div className="bg-[#17130f] border border-white/5 rounded-xl px-3.5 py-2.5 flex flex-col">
        <label className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1">
          附加運費 (HK$)
        </label>
        <div className="flex items-center mt-1">
          <span className="font-mono text-[13px] text-text-disabled mr-1.5 shrink-0">
            HK$
          </span>
          <input
            type="number"
            min={0}
            max={200}
            step={1}
            placeholder="0"
            value={extraShippingFee}
            onChange={(evt) => setExtraShippingFee(evt.target.value)}
            className="w-full bg-transparent text-text-primary text-[14px] font-black focus:outline-none"
          />
        </div>
        <p className="mt-1 font-mono text-[10px] text-text-disabled">
          選填，疊加店舖基本運費
        </p>
      </div>
    );
  };

  const renderConditionDesc = () => {
    if (!isMerch) return null;
    return (
      <div className="bg-[#17130f] border border-white/5 rounded-xl p-3.5 flex flex-col">
        <div className="flex items-center justify-between">
          <label
            htmlFor={isEdit ? `edit-desc-${editProps?.item.id}` : "create-desc"}
            className="font-mono text-[11px] text-text-disabled uppercase tracking-wider"
          >
            品相描述
          </label>
          <span className="font-mono text-[10px] text-[#8A8680]">
            {conditionDesc.length}/{LISTING_DESCRIPTION_MAX}
          </span>
        </div>
        <textarea
          id={isEdit ? `edit-desc-${editProps?.item.id}` : "create-desc"}
          rows={3}
          maxLength={LISTING_DESCRIPTION_MAX}
          placeholder="詳細描述卡面狀況、印刷品質、鏡面完整度等..."
          value={conditionDesc}
          onChange={(evt) => setConditionDesc(evt.target.value)}
          className="mt-1 w-full bg-transparent text-text-primary text-[12.5px] leading-relaxed placeholder-text-disabled resize-none focus:outline-none"
        />
      </div>
    );
  };

  const renderStatusToggle = () => {
    if (!isEdit) return null;
    return (
      <div className="flex items-center justify-between border-t border-white/5 pt-2">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(evt) => setIsActive(evt.target.checked)}
            className="h-4 w-4 cursor-pointer rounded accent-brand"
          />
          <span className="font-mono text-[13px] text-text-secondary">
            商品上架
          </span>
        </label>
      </div>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton
          className="sm:max-w-[720px] w-full max-w-[calc(100%-2rem)] bg-[#26211C] border border-[rgba(237,232,224,0.15)] text-text-primary overflow-y-auto max-h-[92vh] p-5 sm:p-6"
        >
          <DialogHeader>
            <DialogTitle className="font-sans font-bold text-[18px] text-text-primary tracking-tight">
              {formatDisplayTitle(
                mode,
                addAssetMode,
                itemType,
                Boolean(sellPrefill),
              )}
            </DialogTitle>
            {isEdit && editProps && (
              <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
                #{editProps.item.id} · {editProps.sku.cardName} ·{" "}
                {editProps.item.grade}
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-3 space-y-4">
            {renderCatalogSection()}

            <div
              className={`grid gap-3.5 ${
                isCreate && itemType === "box_set" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {renderPriceField()}
              {renderGradingSelect()}
              {renderSealedState()}
            </div>

            {renderAuthToggle()}
            {renderExtraShippingFee()}
            {renderConditionDesc()}
            {renderPhotoGrid()}
            {renderStatusToggle()}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
              multiple={isCreate && isMerch}
              onChange={handleImageChange}
              className="hidden"
            />

            <div className="flex gap-2 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-brand text-[#1A1612] font-sans font-black text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "處理中…"
                  : isEdit
                    ? "確認儲存修改"
                    : sellPrefill
                      ? "🚀 確認上架發售"
                      : addAssetMode === "hobby"
                        ? "★ 收錄至私藏愛好"
                        : itemType === "box_set"
                          ? "🚀 立即發佈盒組上架"
                          : "🚀 立即發佈商品上架"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-11 bg-transparent border border-white/10 text-[#d4c4b7] font-sans font-bold rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                取消
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isEdit && (
        <ImageViewer
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          images={viewerImages}
          remarks={viewerRemarks}
          initialIndex={viewerIndex}
        />
      )}

      {isCreate && (
        <CollectionAddAfterListingDialog
          payload={collectionAddPrompt}
          onClose={() => setCollectionAddPrompt(null)}
        />
      )}
    </>
  );
}

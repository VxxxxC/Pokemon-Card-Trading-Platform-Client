"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImageViewer } from "@/app/components/shared/ImageViewer";
import type { CardInstance, SKUGroup } from "@/app/components/merchant/InventoryAccordion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_GRADING_OPTION_ID,
  GRADING_OPTION_GROUPS,
  getGradingOptionsByGroup,
} from "@/lib/grading/options";
import {
  LISTING_IMAGE_MAX,
  LISTING_PHOTO_SLOT_LABELS,
  type ListingImage,
} from "@/lib/listings/images";
import { submitCardListingWithProgress } from "@/lib/listings/submit-card-listing";
import {
  LISTING_DESCRIPTION_MAX,
  validateImageFile,
} from "@/lib/listings/validation";
import { bunnyObjectKeyFromCdnUrl } from "@/lib/storage/bunny";

type PhotoSlotState = {
  previewUrl: string | null;
  file: File | null;
  existingUrl: string | null;
  existingObjectKey: string | null;
  remark: string;
};

function buildInitialSlots(images: ListingImage[]): PhotoSlotState[] {
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
      remark: image?.remark?.trim() || slotLabel,
    };
  });
}

type ListingEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku: Pick<SKUGroup, "cardName" | "cardNo">;
  item: CardInstance;
  onSaved?: () => void;
};

export function ListingEditDialog({
  open,
  onOpenChange,
  sku,
  item,
  onSaved,
}: ListingEditDialogProps) {
  const [price, setPrice] = useState(String(item.askPrice));
  const [gradingOptionId, setGradingOptionId] = useState(
    item.gradingOptionId || DEFAULT_GRADING_OPTION_ID,
  );
  const [sellerDescription, setSellerDescription] = useState(item.conditionDesc);
  const [isActive, setIsActive] = useState(item.status === "active");
  const [hasAuthenticationToggle, setHasAuthenticationToggle] = useState(
    item.useAuthentication ?? true,
  );
  const [photoSlots, setPhotoSlots] = useState<PhotoSlotState[]>(() =>
    buildInitialSlots(item.images),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [activeReplaceIndex, setActiveReplaceIndex] = useState<number | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoSlotsRef = useRef<PhotoSlotState[]>(photoSlots);

  useEffect(() => {
    photoSlotsRef.current = photoSlots;
  }, [photoSlots]);

  useEffect(() => {
    return () => {
      for (const slot of photoSlotsRef.current) {
        if (slot.file && slot.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(slot.previewUrl);
        }
      }
    };
  }, []);

  const viewerImages = useMemo(
    () =>
      photoSlots
        .map((slot) => slot.previewUrl)
        .filter((url): url is string => Boolean(url)),
    [photoSlots],
  );

  const viewerRemarks = useMemo(
    () => photoSlots.map((slot) => slot.remark),
    [photoSlots],
  );

  const openViewerAt = (slotIndex: number) => {
    if (!photoSlots[slotIndex]?.previewUrl) return;
    const visibleIndex = photoSlots
      .slice(0, slotIndex + 1)
      .filter((slot) => slot.previewUrl).length - 1;
    if (visibleIndex < 0) return;
    setViewerIndex(visibleIndex);
    setIsViewerOpen(true);
  };

  const handleReplaceClick = (slotIndex: number) => {
    setActiveReplaceIndex(slotIndex);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (!file || activeReplaceIndex === null) {
      return;
    }

    const fileError = validateImageFile(file);
    if (fileError) {
      toast.error(`⚠️ ${fileError}`);
      return;
    }

    const slotIndex = activeReplaceIndex;
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
    setActiveReplaceIndex(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error("⚠️ 請輸入有效的售價");
      return;
    }

    if (sellerDescription.length > LISTING_DESCRIPTION_MAX) {
      toast.error(`品相描述不可超過 ${LISTING_DESCRIPTION_MAX} 字`);
      return;
    }

    const missingSlot = photoSlots.find((slot) => !slot.previewUrl);
    if (missingSlot) {
      toast.error("必須上載全部 6 張卡牌相片（正面、背面及四個角）");
      return;
    }

    setIsSubmitting(true);

    const result = await submitCardListingWithProgress({
      mode: "edit",
      listingId: item.id,
      gradingOptionId,
      price: parsedPrice,
      sellerDescription: sellerDescription.trim() || undefined,
      isActive,
      useAuthentication: hasAuthenticationToggle,
      imageSlots: photoSlots.map((slot) => ({
        file: slot.file,
        existingUrl: slot.existingUrl ?? slot.previewUrl ?? undefined,
        existingObjectKey: slot.existingObjectKey ?? undefined,
        remark: slot.remark.trim() || undefined,
      })),
    });

    setIsSubmitting(false);

    if (!result.success) {
      return;
    }

    toast.success(`「${sku.cardName} · ${item.grade}」修改已儲存`);
    onOpenChange(false);
    onSaved?.();
    window.dispatchEvent(new CustomEvent("inventory-should-refresh"));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[720px] w-full max-w-[calc(100%-2rem)] bg-[#1A1612] border border-[rgba(212,165,116,0.20)] text-text-primary overflow-y-auto max-h-[90dvh] p-5 sm:p-6"
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

          <form onSubmit={handleSubmit} className="mt-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-[#17130f] border border-white/5 rounded-xl px-3.5 py-2.5 flex flex-col">
                <label
                  htmlFor={`edit-price-${item.id}`}
                  className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1"
                >
                  售價 (HK$) <span className="text-warning">*</span>
                </label>
                <div className="flex items-center mt-1">
                  <span className="font-mono text-[13px] text-text-disabled mr-1.5 shrink-0">
                    HK$
                  </span>
                  <input
                    id={`edit-price-${item.id}`}
                    type="number"
                    min={1}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-transparent text-text-primary text-[14px] font-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#17130f] border border-white/5 rounded-xl px-3.5 py-2.5 flex flex-col">
                <label className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1">
                  鑑定等級
                </label>
                <Select
                  value={gradingOptionId}
                  onValueChange={(value) =>
                    setGradingOptionId(value ?? DEFAULT_GRADING_OPTION_ID)
                  }
                >
                  <SelectTrigger className="w-full h-10 border border-white/10 bg-[#120F0C] rounded-xl px-3 text-[13px] font-bold text-text-primary focus:ring-1 focus:ring-brand/40">
                    <SelectValue placeholder="選擇鑑定或裸卡品相" />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    sideOffset={4}
                    className="z-[9999] w-(--anchor-width) max-h-60 overflow-y-auto bg-[#26211C] border border-[rgba(237,232,224,0.15)] text-[#eae1da] shadow-2xl rounded-xl"
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
            </div>

            <div className="bg-[#17130f] border border-white/5 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <label
                  htmlFor={`edit-auth-${item.id}`}
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  開放官方中介鑑定
                </label>
                <span className="font-sans text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                  允許買家付費加購 HKCardVault 官方第三方專業鑑定與託管交收
                </span>
              </div>
              <Switch
                id={`edit-auth-${item.id}`}
                checked={hasAuthenticationToggle}
                onCheckedChange={setHasAuthenticationToggle}
                aria-label="開放官方中介鑑定"
              />
            </div>

            <div className="bg-[#17130f] border border-white/5 rounded-xl p-3.5 flex flex-col">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`edit-desc-${item.id}`}
                  className="font-mono text-[11px] text-text-disabled uppercase tracking-wider"
                >
                  品相描述
                </label>
                <span className="font-mono text-[10px] text-[#8A8680]">
                  {sellerDescription.length}/{LISTING_DESCRIPTION_MAX}
                </span>
              </div>
              <textarea
                id={`edit-desc-${item.id}`}
                rows={3}
                maxLength={LISTING_DESCRIPTION_MAX}
                value={sellerDescription}
                onChange={(e) => setSellerDescription(e.target.value)}
                placeholder="詳細描述卡面狀況、印刷品質、鏡面完整度等..."
                className="mt-1 w-full bg-transparent text-text-primary text-[12.5px] leading-relaxed placeholder-text-disabled resize-none focus:outline-none"
              />
            </div>

            <div>
              <p className="font-mono text-[11px] text-text-disabled uppercase tracking-wider mb-1.5">
                實物照片 (必須 6 張) <span className="text-warning">*</span>
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {photoSlots.map((slot, index) => {
                  const slotLabel =
                    LISTING_PHOTO_SLOT_LABELS[index] ?? `實體照 ${index + 1}`;

                  return (
                    <div key={index} className="flex flex-col">
                      <div className="relative aspect-[3/4] rounded-xl border border-white/10 overflow-hidden bg-[#17130f]">
                        {slot.previewUrl ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openViewerAt(index)}
                              className="absolute inset-0 cursor-zoom-in"
                              aria-label={`預覽${slotLabel}`}
                            >
                              <Image
                                src={slot.previewUrl}
                                alt={slotLabel}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReplaceClick(index);
                              }}
                              className="absolute bottom-1 right-1 z-10 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9px] text-brand"
                            >
                              更換
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReplaceClick(index)}
                            className="flex h-full w-full flex-col items-center justify-center gap-1"
                          >
                            <span className="font-mono text-[9px] text-text-disabled">
                              上載
                            </span>
                          </button>
                        )}
                      </div>
                      <span className="mt-1 text-center font-mono text-[9px] text-text-disabled">
                        {slotLabel}
                      </span>
                      <input
                        type="text"
                        value={slot.remark}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPhotoSlots((prev) =>
                            prev.map((entry, idx) =>
                              idx === index ? { ...entry, remark: value } : entry,
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

            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded accent-brand"
                />
                <span className="font-mono text-[13px] text-text-secondary">
                  商品上架
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 shrink-0 rounded-xl bg-brand px-5 font-sans text-[13.5px] font-bold text-[#17130f] transition-all hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "儲存中…" : "確認儲存修改"}
              </button>
            </div>
          </form>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
            onChange={handleFileChange}
            className="hidden"
          />
        </DialogContent>
      </Dialog>

      <ImageViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={viewerImages}
        remarks={viewerRemarks}
        initialIndex={viewerIndex}
      />
    </>
  );
}

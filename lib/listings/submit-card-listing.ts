"use client";

import {
  createCardListing,
  rollbackListingImages,
  updateCardListing,
  type CreateCardListingResult,
} from "@/app/actions/listings";
import { useListingSubmitStore } from "@/app/store/useListingSubmitStore";
import {
  uploadListingImageWithProgress,
  type ClientUploadedListingImage,
} from "@/lib/listings/client-upload";
import { bunnyObjectKeyFromCdnUrl } from "@/lib/storage/bunny";
import type { ListingSubmitMode } from "@/app/store/useListingSubmitStore";
import { LISTING_IMAGE_MAX } from "@/lib/listings/images";

export type ListingImageSlotInput = {
  file?: File | null;
  existingUrl?: string;
  existingObjectKey?: string;
  remark?: string;
};

export type SubmitCardListingInput = {
  mode?: ListingSubmitMode;
  productId?: string;
  listingId?: string;
  gradingOptionId: string;
  price: number;
  sellerDescription?: string;
  useAuthentication?: boolean;
  sourceCollectionId?: string;
  sellerPersona?: "member" | "merchant";
  isActive?: boolean;
  imageFiles?: File[];
  imageSlots?: ListingImageSlotInput[];
  photosRemark?: string[];
};

async function rollbackClientUploadedImages(
  uploadedImages: ClientUploadedListingImage[],
) {
  if (uploadedImages.length === 0) {
    return;
  }

  const objectKeys = uploadedImages.map((image) => image.objectKey);
  const result = await rollbackListingImages(objectKeys);
  if (!result.success) {
    console.error("[submitCardListingWithProgress] rollback failed:", result.error);
  }
}

export async function submitCardListingWithProgress(
  input: SubmitCardListingInput,
): Promise<CreateCardListingResult> {
  const {
    startSubmit,
    setPhase,
    setUploadProgress,
    finishSuccess,
    finishError,
  } = useListingSubmitStore.getState();

  const mode = input.mode ?? "create";
  const isEdit = mode === "edit";
  const uploadTargets = isEdit
    ? (input.imageSlots ?? []).filter((slot) => slot.file)
    : (input.imageFiles ?? []).map((file) => ({ file }));

  const totalUploads = isEdit
    ? uploadTargets.length
    : input.imageFiles?.length ?? 0;

  const uploadedImages: ClientUploadedListingImage[] = [];

  startSubmit(mode, Math.max(totalUploads, 1));

  try {
    setPhase(
      "validating",
      isEdit ? "驗證商品資料…" : "驗證上架資料…",
      6,
    );

    if (isEdit) {
      const slots = input.imageSlots ?? [];
      if (slots.length !== LISTING_IMAGE_MAX) {
        finishError(`必須提供 ${LISTING_IMAGE_MAX} 張相片`);
        return { success: false, error: `必須提供 ${LISTING_IMAGE_MAX} 張相片` };
      }

      let uploadIndex = 0;
      for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
        const slot = slots[slotIndex]!;
        const imageOrder = slotIndex + 1;

        if (slot.file) {
          uploadIndex += 1;
          setUploadProgress(uploadIndex, 0, Math.max(totalUploads, 1));

          const bunnyUpload = await uploadListingImageWithProgress(
            slot.file,
            (percent) => {
              setUploadProgress(uploadIndex, percent, Math.max(totalUploads, 1));
            },
          );

          uploadedImages.push({
            url: bunnyUpload.cdnUrl,
            order: imageOrder,
            objectKey: bunnyUpload.objectKey,
            remark: slot.remark || undefined,
          });
        } else if (slot.existingUrl) {
          const objectKey =
            slot.existingObjectKey?.trim() ||
            bunnyObjectKeyFromCdnUrl(slot.existingUrl) ||
            "";

          uploadedImages.push({
            url: slot.existingUrl,
            order: imageOrder,
            objectKey,
            remark: slot.remark || undefined,
          });
        } else {
          throw new Error("必須上載全部 6 張卡牌相片（正面、背面及四個角）");
        }
      }
    } else {
      for (let index = 0; index < (input.imageFiles?.length ?? 0); index += 1) {
        const file = input.imageFiles![index]!;
        const imageIndex = index + 1;

        setUploadProgress(imageIndex, 0, totalUploads);

        const bunnyUpload = await uploadListingImageWithProgress(file, (percent) => {
          setUploadProgress(imageIndex, percent, totalUploads);
        });

        uploadedImages.push({
          url: bunnyUpload.cdnUrl,
          order: imageIndex,
          objectKey: bunnyUpload.objectKey,
          remark: input.photosRemark?.[index] || undefined,
        });
      }
    }

    setPhase(
      "saving",
      isEdit ? "寫入商品更新…" : "寫入商品資料…",
      92,
    );

    const formData = new FormData();
    formData.append("gradingOptionId", input.gradingOptionId);
    formData.append("price", String(input.price));
    if (input.sellerDescription?.trim()) {
      formData.append("sellerDescription", input.sellerDescription.trim());
    }
    formData.append("uploadedImages", JSON.stringify(uploadedImages));

    const result = isEdit
      ? await (() => {
          if (!input.listingId) {
            return Promise.resolve({
              success: false as const,
              error: "無效的商品",
            });
          }
          formData.append("listingId", input.listingId);
          formData.append("isActive", String(input.isActive ?? true));
          return updateCardListing(formData);
        })()
      : await (() => {
          if (!input.productId) {
            return Promise.resolve({
              success: false as const,
              error: "請從搜尋結果中選擇一張卡牌",
            });
          }
          formData.append("productId", input.productId);
          formData.append(
            "useAuthentication",
            String(input.useAuthentication ?? true),
          );
          if (input.sourceCollectionId) {
            formData.append("sourceCollectionId", input.sourceCollectionId);
          }
          if (input.sellerPersona) {
            formData.append("sellerPersona", input.sellerPersona);
          }
          return createCardListing(formData);
        })();

    if (!result.success) {
      finishError(result.error);
      return result;
    }

    finishSuccess(isEdit ? "商品已成功更新！" : "商品已成功上架！");

    return result;
  } catch (error) {
    await rollbackClientUploadedImages(uploadedImages);
    const message =
      error instanceof Error ? error.message : "商品上架時發生錯誤";
    finishError(message);
    return { success: false, error: message };
  }
}

"use client";

import {
  createCardListing,
  type CreateCardListingResult,
} from "@/app/actions/listings";
import { useListingSubmitStore } from "@/app/store/useListingSubmitStore";
import {
  uploadListingImageWithProgress,
  type ClientUploadedListingImage,
} from "@/lib/listings/client-upload";
import type { ListingSubmitMode } from "@/app/store/useListingSubmitStore";

export type SubmitCardListingInput = {
  mode?: ListingSubmitMode;
  productId: string;
  gradingOptionId: string;
  price: number;
  sellerDescription?: string;
  useAuthentication?: boolean;
  sourceCollectionId?: string;
  imageFiles: File[];
  photosRemark?: string[];
};

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
  const totalImages = input.imageFiles.length;

  startSubmit(mode, totalImages);

  try {
    setPhase(
      "validating",
      mode === "edit" ? "驗證商品資料…" : "驗證上架資料…",
      6,
    );

    const uploadedImages: ClientUploadedListingImage[] = [];

    for (let index = 0; index < input.imageFiles.length; index += 1) {
      const file = input.imageFiles[index]!;
      const imageIndex = index + 1;

      setUploadProgress(imageIndex, 0, totalImages);

      const bunnyUpload = await uploadListingImageWithProgress(file, (percent) => {
        setUploadProgress(imageIndex, percent, totalImages);
      });

      uploadedImages.push({
        url: bunnyUpload.cdnUrl,
        order: imageIndex,
        objectKey: bunnyUpload.objectKey,
        remark: input.photosRemark?.[index] || undefined,
      });
    }

    setPhase(
      "saving",
      mode === "edit" ? "寫入商品更新…" : "寫入商品資料…",
      92,
    );

    const formData = new FormData();
    formData.append("productId", input.productId);
    formData.append("gradingOptionId", input.gradingOptionId);
    formData.append("price", String(input.price));
    if (input.sellerDescription?.trim()) {
      formData.append("sellerDescription", input.sellerDescription.trim());
    }
    formData.append(
      "useAuthentication",
      String(input.useAuthentication ?? true),
    );
    if (input.sourceCollectionId) {
      formData.append("sourceCollectionId", input.sourceCollectionId);
    }
    formData.append("uploadedImages", JSON.stringify(uploadedImages));

    const result = await createCardListing(formData);

    if (!result.success) {
      finishError(result.error);
      return result;
    }

    finishSuccess(
      mode === "edit" ? "商品已成功更新！" : "商品已成功上架！",
    );

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "商品上架時發生錯誤";
    finishError(message);
    return { success: false, error: message };
  }
}

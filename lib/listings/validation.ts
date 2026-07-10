import { hasGradingOption } from "@/lib/grading/options";
import { validateImageUpload } from "@/lib/listings/image-files";
import {
  LISTING_IMAGE_MAX,
  LISTING_IMAGE_MIN,
} from "@/lib/listings/images";

export const LISTING_DESCRIPTION_MAX = 500;

export type CreateCardListingFields = {
  productId: string;
  gradingOptionId: string;
  price: number;
  sellerDescription?: string;
};

export function validateImageFile(file: File): string | null {
  return validateImageUpload({
    size: file.size,
    type: file.type,
    name: file.name,
  });
}

export function validateListingImageCount(count: number): string | null {
  if (count < LISTING_IMAGE_MIN) {
    return "必須上載全部 6 張卡牌相片（正面、背面及四個角）";
  }
  if (count > LISTING_IMAGE_MAX) {
    return `最多只能上載 ${LISTING_IMAGE_MAX} 張相片`;
  }
  return null;
}

export function validateListingImageFiles(files: File[]): string | null {
  const countError = validateListingImageCount(files.length);
  if (countError) return countError;

  for (const file of files) {
    const error = validateImageFile(file);
    if (error) return error;
  }

  return null;
}

export function validateCreateCardListingFields(
  input: CreateCardListingFields,
): string | null {
  if (!input.productId.trim()) {
    return "請從搜尋結果中選擇一張卡牌";
  }

  if (!hasGradingOption(input.gradingOptionId)) {
    return "請選擇有效的鑑定／品相";
  }

  if (!Number.isFinite(input.price) || input.price <= 0) {
    return "請輸入有效的商品放售售價";
  }

  if (
    input.sellerDescription &&
    input.sellerDescription.length > LISTING_DESCRIPTION_MAX
  ) {
    return `品相描述不可超過 ${LISTING_DESCRIPTION_MAX} 字`;
  }

  return null;
}

export function validateCreateCardListing(
  input: CreateCardListingFields,
  imageFiles: File[],
): string | null {
  const fieldError = validateCreateCardListingFields(input);
  if (fieldError) return fieldError;

  return validateListingImageFiles(imageFiles);
}

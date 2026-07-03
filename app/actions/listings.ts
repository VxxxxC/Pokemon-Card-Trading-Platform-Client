"use server";

import { revalidatePath } from "next/cache";
import {
  getGradingOption,
  gradingOptionToFields,
} from "@/lib/grading/options";
import { mapListingInsertError } from "@/lib/listings/errors";
import {
  parseImageUploadsFromFormData,
  validateImageUpload,
  type ParsedImageUpload,
} from "@/lib/listings/image-files";
import { toListingImages, type ListingImage } from "@/lib/listings/images";
import {
  LISTING_DESCRIPTION_MAX,
  validateCreateCardListingFields,
  validateListingImageCount,
} from "@/lib/listings/validation";
import {
  deleteListingImagesFromBunny,
  isBunnyStorageConfigured,
  uploadListingImageToBunny,
} from "@/lib/storage/bunny";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

type ListingRow = Pick<
  Tables<"listings">,
  | "id"
  | "product_id"
  | "price"
  | "grading_company"
  | "grading_score"
  | "images"
  | "status"
>;

export type CreateCardListingResult =
  | { success: true; data: { listingId: string; images: ListingImage[] } }
  | { success: false; error: string };

export type PreUploadedListingImage = ListingImage & {
  objectKey: string;
};

function parsePreUploadedImages(raw: string): PreUploadedListingImage[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const images: PreUploadedListingImage[] = [];
    for (const item of parsed) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as PreUploadedListingImage).url !== "string" ||
        typeof (item as PreUploadedListingImage).order !== "number" ||
        typeof (item as PreUploadedListingImage).objectKey !== "string"
      ) {
        return null;
      }

      images.push({
        url: (item as PreUploadedListingImage).url,
        order: (item as PreUploadedListingImage).order,
        objectKey: (item as PreUploadedListingImage).objectKey,
      });
    }

    return images;
  } catch {
    return null;
  }
}

function parseCreateCardListingForm(formData: FormData): {
  fields: {
    productId: string;
    gradingOptionId: string;
    price: number;
    sellerDescription?: string;
  };
  uploads: ParsedImageUpload[];
  preUploaded: PreUploadedListingImage[] | null;
  rawImageEntryCount: number;
} {
  const productId = String(formData.get("productId") ?? "").trim();
  const gradingOptionId = String(formData.get("gradingOptionId") ?? "").trim();
  const price = Number(formData.get("price"));
  const sellerDescription = String(
    formData.get("sellerDescription") ?? "",
  )
    .trim()
    .slice(0, LISTING_DESCRIPTION_MAX);

  const rawImageEntries = formData.getAll("images");
  const uploads = parseImageUploadsFromFormData(formData);
  const uploadedImagesRaw = String(formData.get("uploadedImages") ?? "").trim();
  const preUploaded = uploadedImagesRaw
    ? parsePreUploadedImages(uploadedImagesRaw)
    : null;

  return {
    fields: {
      productId,
      gradingOptionId,
      price,
      sellerDescription: sellerDescription || undefined,
    },
    uploads,
    preUploaded,
    rawImageEntryCount: rawImageEntries.length,
  };
}

function validateServerListingSubmit(
  fields: ReturnType<typeof parseCreateCardListingForm>["fields"],
  uploads: ParsedImageUpload[],
  preUploaded: PreUploadedListingImage[] | null,
  rawImageEntryCount: number,
): string | null {
  const fieldError = validateCreateCardListingFields(fields);
  if (fieldError) return fieldError;

  const imageCount = preUploaded?.length ?? uploads.length;
  const countError = validateListingImageCount(imageCount);
  if (countError) {
    if (preUploaded) return countError;
    if (rawImageEntryCount === 0) {
      return "圖片未能傳送到伺服器，請重試或壓縮相片後再上載";
    }
    if (rawImageEntryCount > 0 && uploads.length === 0) {
      return "圖片格式不支援，請使用 JPG、PNG、WEBP 或 HEIC";
    }
    return countError;
  }

  if (preUploaded) {
    return null;
  }

  for (const upload of uploads) {
    const error = validateImageUpload({
      size: upload.blob.size,
      type: upload.contentType,
      name: upload.name,
    });
    if (error) return error;
  }

  return null;
}

function resolveSellerPersona(
  role: Tables<"profiles">["role"] | undefined,
): Tables<"listings">["seller_persona"] {
  return role === "merchant" ? "merchant" : "member";
}

async function rollbackUploadedListingImages(objectKeys: string[]) {
  if (objectKeys.length === 0) return;
  await deleteListingImagesFromBunny(objectKeys);
}

export async function createCardListing(
  formData: FormData,
): Promise<CreateCardListingResult> {
  const { fields, uploads, preUploaded, rawImageEntryCount } =
    parseCreateCardListingForm(formData);

  if (formData.get("uploadedImages") && !preUploaded) {
    return { success: false, error: "上載的圖片資料無效，請重新上載相片" };
  }

  const validationError = validateServerListingSubmit(
    fields,
    uploads,
    preUploaded,
    rawImageEntryCount,
  );

  if (validationError) {
    return { success: false, error: validationError };
  }

  const uploadedObjectKeys: string[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再上架商品" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle<Pick<Tables<"profiles">, "id" | "role">>();

    if (profileError || !profile) {
      return { success: false, error: "無法驗證賣家身份" };
    }

    const { data: catalogRow, error: catalogError } = await supabase
      .from("product_catalog")
      .select("id")
      .eq("id", fields.productId)
      .maybeSingle<{ id: string }>();

    if (catalogError || !catalogRow) {
      return { success: false, error: "所選卡牌不存在於商品目錄" };
    }

    if (!isBunnyStorageConfigured()) {
      return { success: false, error: "圖片儲存服務尚未設定，請稍後再試" };
    }

    const grading = gradingOptionToFields(
      getGradingOption(fields.gradingOptionId),
    );

    let images: ListingImage[];
    if (preUploaded) {
      uploadedObjectKeys.push(...preUploaded.map((image) => image.objectKey));
      images = preUploaded.map(({ url, order }) => ({ url, order }));
    } else {
      const uploadedUrls: string[] = [];
      for (const upload of uploads) {
        const bytes = new Uint8Array(await upload.blob.arrayBuffer());
        const bunnyUpload = await uploadListingImageToBunny(
          user.id,
          bytes,
          upload.contentType,
        );
        uploadedObjectKeys.push(bunnyUpload.objectKey);
        uploadedUrls.push(bunnyUpload.cdnUrl);
      }

      images = toListingImages(uploadedUrls);
    }

    const admin = createAdminClient();
    const { data: listing, error: insertError } = await admin
      .from("listings")
      .insert({
        product_id: fields.productId,
        seller_id: user.id,
        price: fields.price,
        grading_company: grading.grader,
        grading_score: grading.gradeScore,
        images,
        seller_description: fields.sellerDescription ?? null,
        status: "active",
        seller_persona: resolveSellerPersona(profile.role),
        use_authentication: false,
      })
      .select("id, product_id, price, grading_company, grading_score, images, status")
      .single<ListingRow>();

    if (insertError || !listing) {
      console.error("[createCardListing]", {
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
      });
      await rollbackUploadedListingImages(uploadedObjectKeys);
      return { success: false, error: mapListingInsertError(insertError) };
    }

    revalidatePath("/marketplace");

    return {
      success: true,
      data: {
        listingId: listing.id,
        images,
      },
    };
  } catch (error) {
    console.error("[createCardListing]", error);
    await rollbackUploadedListingImages(uploadedObjectKeys);

    if (error instanceof Error && error.message.includes("Bunny")) {
      return { success: false, error: "圖片上載失敗，請稍後再試" };
    }

    return { success: false, error: "商品上架時發生錯誤" };
  }
}

import {
  resolveImageContentType,
  validateImageUpload,
} from "@/lib/listings/image-files";

type UploadShopAvatarApiResponse =
  | { success: true; data: { objectKey: string; cdnUrl: string } }
  | { success: false; error: string };

export async function uploadMerchantShopAvatar(
  file: File,
): Promise<{ objectKey: string; cdnUrl: string }> {
  const contentType = resolveImageContentType(file);
  if (!contentType) {
    throw new Error("圖片格式不支援，請使用 JPG、PNG、WEBP 或 HEIC");
  }

  const validationError = validateImageUpload({
    size: file.size,
    type: contentType,
    name: file.name,
  });
  if (validationError) {
    throw new Error(validationError);
  }

  const body = new FormData();
  body.append("image", file, file.name || `shop-avatar-${Date.now()}.jpg`);

  const response = await fetch("/api/merchant/upload-avatar", {
    method: "POST",
    body,
  });

  const payload = (await response.json()) as UploadShopAvatarApiResponse;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.success === false ? payload.error : `店舖頭像上載失敗 (${response.status})`,
    );
  }

  return payload.data;
}

type UploadShopBannerApiResponse =
  | { success: true; data: { objectKey: string; cdnUrl: string } }
  | { success: false; error: string };

export async function uploadMerchantShopTopBanner(
  file: File,
): Promise<{ objectKey: string; cdnUrl: string }> {
  const contentType = resolveImageContentType(file);
  if (!contentType) {
    throw new Error("圖片格式不支援，請使用 JPG、PNG、WEBP 或 HEIC");
  }

  const validationError = validateImageUpload({
    size: file.size,
    type: contentType,
    name: file.name,
  });
  if (validationError) {
    throw new Error(validationError);
  }

  const body = new FormData();
  body.append("image", file, file.name || `shop-banner-${Date.now()}.jpg`);

  const response = await fetch("/api/merchant/upload-top-banner", {
    method: "POST",
    body,
  });

  const payload = (await response.json()) as UploadShopBannerApiResponse;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.success === false ? payload.error : `店舖橫幅上載失敗 (${response.status})`,
    );
  }

  return payload.data;
}

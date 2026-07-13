import { resolveImageContentType } from "@/lib/listings/image-files";

export type ClientUploadedListingImage = {
  url: string;
  order: number;
  objectKey: string;
  remark?: string;
};

type UploadImageApiResponse =
  | { success: true; data: { objectKey: string; cdnUrl: string } }
  | { success: false; error: string };

export async function uploadListingImageWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<{ objectKey: string; cdnUrl: string }> {
  const contentType = resolveImageContentType(file);
  if (!contentType) {
    throw new Error("圖片格式不支援，請使用 JPG、PNG、WEBP 或 HEIC");
  }

  const body = new FormData();
  body.append("image", file, file.name || `listing-${Date.now()}.jpg`);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/listings/upload-image");
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };

    xhr.onload = () => {
      const payload = xhr.response as UploadImageApiResponse | null;

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new Error(
            payload && "error" in payload
              ? payload.error
              : `圖片上載失敗 (${xhr.status})`,
          ),
        );
        return;
      }

      if (!payload?.success) {
        reject(new Error(payload?.error ?? "圖片上載失敗"));
        return;
      }

      onProgress(100);
      resolve(payload.data);
    };

    xhr.onerror = () => {
      reject(new Error("網絡錯誤，圖片上載失敗"));
    };

    xhr.send(body);
  });
}

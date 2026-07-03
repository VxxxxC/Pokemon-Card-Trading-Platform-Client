import {
  LISTING_IMAGE_ACCEPTED_TYPES,
  LISTING_IMAGE_MAX_BYTES,
} from "@/lib/listings/images";

const ACCEPTED_TYPE_SET = new Set<string>(LISTING_IMAGE_ACCEPTED_TYPES);

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export type ImageUploadLike = {
  size: number;
  type?: string;
  name?: string;
};

export function resolveImageContentType(file: ImageUploadLike): string | null {
  const mime = file.type?.toLowerCase() ?? "";
  if (mime && ACCEPTED_TYPE_SET.has(mime)) {
    return mime;
  }

  if (mime === "image/jpg") {
    return "image/jpeg";
  }

  if (mime.startsWith("image/")) {
    if (mime.includes("heic") || mime.includes("heif")) {
      return "image/heic";
    }
    if (mime.includes("jpeg") || mime.includes("jpg")) {
      return "image/jpeg";
    }
    if (mime.includes("png")) {
      return "image/png";
    }
    if (mime.includes("webp")) {
      return "image/webp";
    }
  }

  const extension = file.name?.split(".").pop()?.toLowerCase();
  if (extension) {
    const fromExtension = EXTENSION_TO_MIME[extension];
    if (fromExtension && ACCEPTED_TYPE_SET.has(fromExtension)) {
      return fromExtension;
    }
  }

  // iOS / mobile picker edge case: empty type + no extension, still an image blob
  if (!mime && file.size > 0) {
    return "image/jpeg";
  }

  return null;
}

export function isFormDataImageUpload(
  entry: FormDataEntryValue,
): entry is File {
  return entry instanceof File && entry.size > 0;
}

export type ParsedImageUpload = {
  blob: Blob;
  name: string;
  contentType: string;
};

export function parseImageUploadsFromFormData(
  formData: FormData,
): ParsedImageUpload[] {
  const parsed: ParsedImageUpload[] = [];

  formData.getAll("images").forEach((entry, index) => {
    if (!isFormDataImageUpload(entry)) return;

    const contentType = resolveImageContentType({
      size: entry.size,
      type: entry.type,
      name: entry.name,
    });

    if (!contentType) return;

    parsed.push({
      blob: entry,
      name: entry.name || `listing-${index + 1}.jpg`,
      contentType,
    });
  });

  return parsed;
}

export function validateImageUpload(file: ImageUploadLike): string | null {
  const contentType = resolveImageContentType(file);
  if (!contentType) {
    return "只支援 JPG、PNG、WEBP、HEIC 格式";
  }
  if (file.size > LISTING_IMAGE_MAX_BYTES) {
    return "單張圖片不可超過 10MB";
  }
  if (file.size <= 0) {
    return "圖片檔案無效";
  }
  return null;
}

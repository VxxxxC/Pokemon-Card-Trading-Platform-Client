import { create } from "zustand";

export type ListingSubmitMode = "create" | "edit";

export type ListingSubmitPhase =
  | "idle"
  | "validating"
  | "uploading"
  | "saving"
  | "success"
  | "error";

type ListingSubmitStore = {
  isOpen: boolean;
  mode: ListingSubmitMode;
  phase: ListingSubmitPhase;
  statusMessage: string;
  progress: number;
  currentImageIndex: number;
  totalImages: number;
  error: string | null;
  startSubmit: (mode: ListingSubmitMode, totalImages: number) => void;
  setPhase: (
    phase: ListingSubmitPhase,
    statusMessage: string,
    progress?: number,
  ) => void;
  setUploadProgress: (
    imageIndex: number,
    imagePercent: number,
    totalImages: number,
  ) => void;
  finishSuccess: (message?: string) => void;
  finishError: (error: string) => void;
  reset: () => void;
};

const UPLOAD_PROGRESS_START = 8;
const UPLOAD_PROGRESS_END = 88;

function uploadProgressValue(
  imageIndex: number,
  imagePercent: number,
  totalImages: number,
): number {
  if (totalImages <= 0) return UPLOAD_PROGRESS_START;

  const slice = (UPLOAD_PROGRESS_END - UPLOAD_PROGRESS_START) / totalImages;
  const completed = Math.max(0, imageIndex - 1) * slice;
  const current = (imagePercent / 100) * slice;

  return Math.min(
    UPLOAD_PROGRESS_END,
    Math.round(UPLOAD_PROGRESS_START + completed + current),
  );
}

export const useListingSubmitStore = create<ListingSubmitStore>((set) => ({
  isOpen: false,
  mode: "create",
  phase: "idle",
  statusMessage: "",
  progress: 0,
  currentImageIndex: 0,
  totalImages: 0,
  error: null,

  startSubmit: (mode, totalImages) =>
    set({
      isOpen: true,
      mode,
      phase: "validating",
      statusMessage:
        mode === "edit" ? "驗證商品資料…" : "驗證上架資料…",
      progress: 4,
      currentImageIndex: 0,
      totalImages,
      error: null,
    }),

  setPhase: (phase, statusMessage, progress) =>
    set((state) => ({
      phase,
      statusMessage,
      progress: progress ?? state.progress,
    })),

  setUploadProgress: (imageIndex, imagePercent, totalImages) =>
    set({
      phase: "uploading",
      currentImageIndex: imageIndex,
      totalImages,
      statusMessage: `上載相片 (${imageIndex}/${totalImages})…`,
      progress: uploadProgressValue(imageIndex, imagePercent, totalImages),
    }),

  finishSuccess: (message) =>
    set({
      phase: "success",
      statusMessage: message ?? "商品已成功上架！",
      progress: 100,
      error: null,
    }),

  finishError: (error) =>
    set({
      phase: "error",
      statusMessage: "上架失敗",
      error,
      progress: 0,
    }),

  reset: () =>
    set({
      isOpen: false,
      mode: "create",
      phase: "idle",
      statusMessage: "",
      progress: 0,
      currentImageIndex: 0,
      totalImages: 0,
      error: null,
    }),
}));
